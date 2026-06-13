import OpenAI from 'openai';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { format, addDays, setHours, setMinutes, isBefore, isAfter, parseISO } from 'date-fns';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIResponse {
  reply: string;
  action: 'book_appointment' | 'cancel' | 'reschedule' | 'answer_faq' | 'escalate' | 'none';
  confidence: number;
  appointmentData?: {
    treatment: string | null;
    requestedDateTime: string | null;
    notes: string | null;
  };
}

interface ClinicContext {
  clinicId: string;
  clinicName: string;
  specialty: string;
  workingHours: string;
  address: string;
  phone: string;
  treatments: string;
  patientPhone: string;
  patientHistory: string;
  conversationHistory: string;
  aiLanguage: string;
  aiPersonality: string;
  customIntroMsg?: string;
}

/**
 * Get available appointment slots for the next 7 days.
 */
async function getAvailableSlots(clinicId: string, workingHours: string): Promise<string> {
  try {
    const hours = JSON.parse(workingHours || '{}');
    const slots: string[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = addDays(now, i);
      const dayName = format(date, 'EEEE').toLowerCase();
      const dayConfig = hours[dayName];

      if (!dayConfig?.isOpen) continue;

      const [openH, openM] = (dayConfig.open || '09:00').split(':').map(Number);
      const [closeH, closeM] = (dayConfig.close || '17:00').split(':').map(Number);

      const slotDuration = dayConfig.slotDuration || 30;
      let slotTime = setMinutes(setHours(date, openH), openM);
      const closeTime = setMinutes(setHours(date, closeH), closeM);

      // Get booked slots for this day
      const booked = await prisma.appointment.findMany({
        where: {
          clinicId,
          dateTime: {
            gte: setHours(date, 0),
            lte: setHours(date, 23),
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
        },
        select: { dateTime: true, durationMin: true },
      });

      const daySlots: string[] = [];
      while (isBefore(slotTime, closeTime)) {
        if (isAfter(slotTime, now)) {
          const isBooked = booked.some((b) => {
            const bEnd = new Date(b.dateTime.getTime() + b.durationMin * 60000);
            const sEnd = new Date(slotTime.getTime() + slotDuration * 60000);
            return (
              (isAfter(slotTime, b.dateTime) || slotTime.getTime() === b.dateTime.getTime()) &&
              isBefore(slotTime, bEnd)
            ) || (
              isBefore(b.dateTime, sEnd) && isAfter(b.dateTime, slotTime)
            );
          });

          if (!isBooked) {
            daySlots.push(format(slotTime, 'h:mm a'));
          }
        }
        slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
      }

      if (daySlots.length > 0) {
        slots.push(`${format(date, 'EEEE, MMM d')}: ${daySlots.slice(0, 8).join(', ')}`);
      }
    }

    return slots.length > 0 ? slots.join('\n') : 'No available slots in the next 7 days.';
  } catch {
    return 'Unable to fetch available slots.';
  }
}

/**
 * Build the AI system prompt with all clinic context injected.
 */
function buildSystemPrompt(ctx: ClinicContext, availableSlots: string): string {
  const personalityDesc = {
    professional: 'polite and professional',
    friendly: 'warm, friendly, and approachable',
    formal: 'formal and precise',
  }[ctx.aiPersonality] ?? 'polite and professional';

  return `You are the AI receptionist for ${ctx.clinicName}, a ${ctx.specialty || 'medical'} clinic. Be ${personalityDesc}.

CLINIC INFORMATION:
- Working hours: ${ctx.workingHours}
- Address: ${ctx.address || 'Contact clinic for address'}
- Phone: ${ctx.phone}
${ctx.customIntroMsg ? `- Welcome message: ${ctx.customIntroMsg}` : ''}

AVAILABLE APPOINTMENT SLOTS (next 7 days):
${availableSlots}

TREATMENTS OFFERED:
${ctx.treatments || 'General consultations available'}

PATIENT HISTORY:
${ctx.patientHistory}

YOUR RULES:
1. Be ${personalityDesc} at all times
2. Reply in the SAME language the patient used (English, Arabic, or Urdu — detect and match)
3. For appointment booking: confirm treatment, date, and time BEFORE creating
4. NEVER confirm an appointment for an already-booked time slot
5. NEVER confirm outside working hours or on days the clinic is closed
6. If a patient asks something you cannot handle, say "Let me connect you with the clinic team" and set action to "escalate"
7. Keep replies SHORT (max 3 sentences for simple queries, 5 for booking confirmations)
8. For cancellations: confirm appointment details before cancelling
9. Always end booking confirmations with: "You will receive a reminder before your appointment."
10. Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}

RESPOND ONLY WITH THIS EXACT JSON (no other text, no markdown):
{
  "reply": "Message to send to patient in their language",
  "action": "book_appointment | cancel | reschedule | answer_faq | escalate | none",
  "confidence": 0.95,
  "appointmentData": {
    "treatment": "treatment name or null",
    "requestedDateTime": "ISO datetime string or null",
    "notes": "any special notes or null"
  }
}`;
}

/**
 * Main AI processing function.
 * Takes inbound patient message and returns structured AI response.
 */
export async function processInboundMessage(
  ctx: ClinicContext,
  userMessage: string
): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const availableSlots = await getAvailableSlots(ctx.clinicId, ctx.workingHours);
    const systemPrompt = buildSystemPrompt(ctx, availableSlots);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages)
    if (ctx.conversationHistory) {
      const history = ctx.conversationHistory.split('\n').slice(-10);
      history.forEach((line) => {
        if (line.startsWith('Patient: ')) {
          messages.push({ role: 'user', content: line.replace('Patient: ', '') });
        } else if (line.startsWith('AI: ')) {
          messages.push({ role: 'assistant', content: line.replace('AI: ', '') });
        }
      });
    }

    messages.push({ role: 'user', content: userMessage });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as AIResponse;

    const durationMs = Date.now() - startTime;
    logger.info(`AI processed message in ${durationMs}ms, action: ${parsed.action}`);

    return {
      reply: parsed.reply ?? "I'm here to help! Could you please repeat your message?",
      action: parsed.action ?? 'none',
      confidence: parsed.confidence ?? 0.5,
      appointmentData: parsed.appointmentData,
    };
  } catch (err) {
    logger.error('AI processing failed', { err });
    // Graceful fallback — do NOT leave patient without a response
    return {
      reply: `Thank you for contacting ${ctx.clinicName}. Our team will get back to you shortly.`,
      action: 'escalate',
      confidence: 0,
    };
  }
}

/**
 * Generate AI-suggested reply for a given message thread (used in dashboard).
 */
export async function generateReplySuggestion(
  patientName: string,
  lastMessages: string,
  clinicName: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a medical receptionist for ${clinicName}. Suggest a short, professional reply to the patient's last message. Return only the reply text, nothing else.`,
        },
        { role: 'user', content: `Patient: ${patientName}\n\nConversation:\n${lastMessages}\n\nSuggest a reply:` },
      ],
      max_tokens: 150,
      temperature: 0.4,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

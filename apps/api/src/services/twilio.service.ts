import twilio from 'twilio';
import { logger } from '../lib/logger';

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

/**
 * Send a WhatsApp message via Twilio.
 * @param to   Recipient phone number (e.g. +97155XXXXXXX)
 * @param body Message text
 */
export async function sendWhatsApp(to: string, body: string): Promise<string | null> {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const from = process.env.TWILIO_WHATSAPP_NUMBER!;
    const message = await getClient().messages.create({ from, to: formattedTo, body });
    logger.info(`WhatsApp sent to ${to}: SID ${message.sid}`);
    return message.sid;
  } catch (err) {
    logger.error('Failed to send WhatsApp', { to, err });
    return null;
  }
}

/**
 * Send an SMS via Twilio.
 */
export async function sendSMS(to: string, body: string): Promise<string | null> {
  try {
    const message = await getClient().messages.create({
      from: process.env.TWILIO_SMS_NUMBER!,
      to,
      body,
    });
    logger.info(`SMS sent to ${to}: SID ${message.sid}`);
    return message.sid;
  } catch (err) {
    logger.error('Failed to send SMS', { to, err });
    return null;
  }
}

/**
 * Send a message via the same channel the patient originally used.
 */
export async function sendReply(
  to: string,
  body: string,
  channel: 'WHATSAPP' | 'SMS'
): Promise<string | null> {
  if (channel === 'WHATSAPP') {
    return sendWhatsApp(to, body);
  }
  return sendSMS(to, body);
}

/**
 * Generate TwiML for inbound voice calls.
 * Returns XML string for Twilio to execute.
 */
export function generateVoiceTwiML(clinicName: string, greeting: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Gather numDigits="1" action="/api/webhooks/twilio/voice/gather" method="POST">
    <Say voice="Polly.Joanna">Press 1 to book an appointment. Press 2 to cancel or reschedule. Press 3 to speak with our team.</Say>
  </Gather>
  <Say voice="Polly.Joanna">We didn't receive your input. Please call back and try again. Thank you for calling ${clinicName}.</Say>
</Response>`;
}

/**
 * Validate that a webhook request genuinely came from Twilio.
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) return false;
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
}

'use client';

import { use, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { format, parseISO } from 'date-fns';
import { MapPin, Phone, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ClinicPublicInfo {
  id: string;
  name: string;
  ownerName: string;
  specialty?: string;
  address?: string;
  phone: string;
  logoUrl?: string;
  treatments?: string;
  workingHours?: string;
  isActive: boolean;
}

interface BookingForm {
  fullName: string;
  phone: string;
  email?: string;
  treatment: string;
  dateTime: string;
  notes?: string;
}

// Next.js 15 requires params to be a Promise
export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [booked, setBooked] = useState(false);

  const { data: clinic, isLoading, error } = useQuery({
    queryKey: ['public-clinic', slug],
    queryFn: () => api.get<ClinicPublicInfo>(`/api/public/clinic/${slug}`),
    retry: false,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', slug, selectedDate],
    queryFn: () =>
      api.get<{ slots: string[] }>(`/api/public/slots/${slug}?date=${selectedDate}`),
    enabled: !!selectedDate && !!clinic,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BookingForm>();

  const bookMutation = useMutation({
    mutationFn: (data: BookingForm) => api.post(`/api/public/book/${slug}`, data),
    onSuccess: () => setBooked(true),
    onError: (err: { error?: string }) => toast.error(err?.error ?? 'Booking failed. Please try again.'),
  });

  const treatments = clinic?.treatments ? JSON.parse(clinic.treatments) as { name: string; fee: number }[] : [];

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const onSubmit = (data: BookingForm) => {
    if (!selectedSlot) { toast.error('Please select an appointment time'); return; }
    bookMutation.mutate({ ...data, dateTime: selectedSlot });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted font-semibold">Loading clinic info...</p>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏥</div>
          <h2 className="text-xl font-extrabold text-primary mb-2">Clinic Not Found</h2>
          <p className="text-muted">This booking link is no longer active or doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="bg-white rounded-[18px] shadow-modal p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-xl font-extrabold text-primary mb-2">Booking Confirmed! ✅</h2>
          <p className="text-muted text-sm">
            Your appointment has been sent to <strong>{clinic.name}</strong>.
            You will receive a WhatsApp confirmation shortly.
          </p>
          <Button className="mt-6 w-full" onClick={() => setBooked(false)}>
            Book Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[18px] shadow-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={clinic.name} imageUrl={clinic.logoUrl} size="lg" />
            <div>
              <h1 className="text-xl font-extrabold text-primary">{clinic.name}</h1>
              <p className="text-sm text-muted capitalize">{clinic.specialty}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {clinic.address && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="w-4 h-4 text-faint flex-shrink-0" />{clinic.address}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted">
              <Phone className="w-4 h-4 text-faint flex-shrink-0" />{clinic.phone}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[18px] shadow-card p-6">
          <h2 className="text-lg font-extrabold text-primary mb-5">Book an Appointment</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Your Full Name *</label>
              <input className={`input ${errors.fullName ? 'border-danger' : ''}`} placeholder="Ahmed Al-Rashid"
                {...register('fullName', { required: 'Your name is required' })} />
              {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">WhatsApp / Phone *</label>
              <input type="tel" className={`input ${errors.phone ? 'border-danger' : ''}`} placeholder="+971 50 123 4567"
                {...register('phone', { required: 'Phone number is required' })} />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Email (optional)</label>
              <input type="email" className="input" placeholder="your@email.com" {...register('email')} />
            </div>
            {treatments.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Treatment *</label>
                <select className={`input ${errors.treatment ? 'border-danger' : ''}`}
                  {...register('treatment', { required: 'Please select a treatment' })}>
                  <option value="">Select a treatment...</option>
                  {treatments.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}{t.fee ? ` — AED ${t.fee}` : ''}</option>
                  ))}
                </select>
                {errors.treatment && <p className="text-xs text-danger mt-1">{errors.treatment.message}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />Select Date *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {availableDates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button key={dateStr} type="button"
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(''); }}
                      className={`flex flex-col items-center p-2 rounded-btn border-2 transition-all text-xs ${isSelected ? 'border-brand bg-brand-light text-brand' : 'border-border hover:border-brand/50 text-muted'}`}>
                      <span className="font-bold">{format(date, 'EEE')}</span>
                      <span>{format(date, 'd')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedDate && (
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />Select Time *
                </label>
                {loadingSlots ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-10 rounded-btn" />)}
                  </div>
                ) : slotsData?.slots?.length === 0 ? (
                  <p className="text-sm text-muted font-semibold py-4 text-center">No available slots on this day.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slotsData?.slots?.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button key={slot} type="button"
                          onClick={() => { setSelectedSlot(slot); setValue('dateTime', slot); }}
                          className={`py-2.5 rounded-btn border-2 text-sm font-bold transition-all ${isSelected ? 'border-brand bg-brand text-white' : 'border-border hover:border-brand text-muted hover:text-primary'}`}>
                          {format(parseISO(slot), 'h:mm a')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Notes (optional)</label>
              <textarea className="input resize-none" rows={3} placeholder="Any symptoms or special requirements..." {...register('notes')} />
            </div>
            <Button type="submit" size="lg" className="w-full" loading={bookMutation.isPending} disabled={!selectedSlot}>
              Book Appointment →
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-muted mt-4">Powered by <span className="font-bold text-brand">ClinicOS AI</span></p>
      </div>
    </div>
  );
}

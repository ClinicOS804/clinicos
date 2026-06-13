'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientVerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!phone.trim()) { toast.error('Enter your phone number'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/patient/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json() as { sessionToken?: string; message?: string };
      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
        setStep('otp');
        toast.success('OTP sent to your phone!');
      }
    } catch {
      toast.error('Failed to send OTP. Check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/patient/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, sessionToken }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (data.token) {
        localStorage.setItem('patientToken', data.token);
        toast.success('Verified!');
        router.push('/my-appointments');
      } else {
        toast.error(data.error ?? 'Invalid OTP');
      }
    } catch {
      toast.error('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="bg-white rounded-[18px] shadow-modal p-8 max-w-sm w-full">
        <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-6 h-6 text-brand" />
        </div>
        <h2 className="text-lg font-extrabold text-primary text-center mb-1">Verify Your Identity</h2>
        <p className="text-sm text-muted text-center mb-6">
          {step === 'phone'
            ? 'Enter your phone number to receive an OTP'
            : 'Enter the 6-digit code sent to your phone'
          }
        </p>

        {step === 'phone' ? (
          <div className="space-y-4">
            <input
              type="tel"
              className="input text-center text-lg tracking-wide"
              placeholder="+971 50 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRequestOTP()}
            />
            <Button className="w-full" onClick={handleRequestOTP} loading={loading}>
              Send OTP <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-2xl tracking-[0.5em] font-bold"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
              autoFocus
            />
            <Button className="w-full" onClick={handleVerifyOTP} loading={loading}>
              Verify & Continue <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-xs font-semibold text-muted hover:text-primary"
            >
              ← Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

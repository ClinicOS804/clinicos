'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 bg-danger-light rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-danger" />
      </div>
      <h2 className="text-lg font-extrabold text-primary mb-2">Something went wrong</h2>
      <p className="text-sm text-muted max-w-sm mb-6">
        {error.message || 'An unexpected error occurred. Our team has been notified.'}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}

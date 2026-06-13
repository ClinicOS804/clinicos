import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Appointment | ClinicOS AI',
  robots: { index: true, follow: true },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

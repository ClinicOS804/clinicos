import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-[#e2e8f0] mb-4">404</p>
        <h1 className="text-2xl font-extrabold text-primary mb-2">Page not found</h1>
        <p className="text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-brand text-white px-6 py-3 rounded-btn font-bold text-sm hover:bg-brand-dark transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="bg-subtle text-muted px-6 py-3 rounded-btn font-bold text-sm hover:bg-border transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

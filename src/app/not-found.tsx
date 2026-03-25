import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-serif font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-serif font-bold text-navy-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="btn-primary mt-8 gap-2">
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}

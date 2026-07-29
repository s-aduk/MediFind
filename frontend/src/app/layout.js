import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = {
  title: 'MediFind',
  description: 'Find and order medicine near you',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
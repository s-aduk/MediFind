import './globals.css';

export const metadata = {
  title: 'MediFind',
  description: 'Find and order medicine near you',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
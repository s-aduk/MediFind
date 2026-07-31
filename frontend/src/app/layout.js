import './globals.css';

export const metadata = {
  title: 'MediFind',
  description: 'Find and order medicine near you',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        {/* Runs before first paint so the correct theme class is set on <html>
            before React hydrates - this is what prevents a light/dark flash
            on load. Reads the stored preference if the user has toggled
            before, otherwise falls back to the OS-level preference. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('medifind-theme');
                var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            })();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this rule targets
            the legacy pages/_document.js pattern; manual <link> tags in the App Router's
            root layout are the documented, correct approach here. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ivory text-ink">{children}</body>
    </html>
  );
}
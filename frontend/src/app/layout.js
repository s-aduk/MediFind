export const metadata = {
  title: 'MediFind',
  description: 'Find and order medicine near you',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
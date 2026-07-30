'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Login from '../../components/Login';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/search';

  const handleLogin = () => {
    router.push(redirectTo);
  };

  return (
    <main className="min-h-screen bg-mist/60 px-4 py-10">
      <Login onLogin={handleLogin} />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

'use client';

import { Suspense } from 'react';

function SearchContent() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Search Page</h1>
      <p>Search interface goes here.</p>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}

import Link from 'next/link';
import { ArrowRight, Search, MapPinned, PackageCheck } from 'lucide-react';

const steps = [
  {
    index: '01',
    title: 'Search medicines',
    description: "Enter what you're looking for and see real-time availability across pharmacies near you.",
    Icon: Search,
  },
  {
    index: '02',
    title: 'Compare pharmacies',
    description: 'See stock levels, prices, and distance side by side, ranked by what matters to you.',
    Icon: MapPinned,
  },
  {
    index: '03',
    title: 'Place your order',
    description: 'Reserve it in a few clicks, then pick up or arrange delivery with the pharmacy directly.',
    Icon: PackageCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ivory">
      {/* Nav */}
      <header className="border-b border-pine-soft">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-pine tracking-tight">
            MediFind
          </span>
          <Link
            href="/search"
            className="font-mono text-xs uppercase tracking-widest text-pine hover:text-pine-light transition-colors"
          >
            Search &rarr;
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-clay mb-6">
              Real-time pharmacy availability
            </p>
            <h1 className="font-display text-5xl sm:text-6xl font-medium text-pine leading-[1.05] mb-6 text-balance">
              Find the medicine you need, instantly.
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-lg">
              Search across pharmacies near you, compare stock and price in real time, and
              order with confidence &mdash; no more calling around.
            </p>
            <Link
              href="/search"
              className="group relative inline-flex items-center gap-3 bg-pine text-ivory pl-7 pr-6 py-4 rounded-full font-medium hover:bg-pine-light transition-colors shadow-card"
            >
              <span className="absolute inset-0 rounded-full pulse-ring" aria-hidden="true" />
              Start searching
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Signature capsule motif */}
        <svg
          className="hidden md:block absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-90"
          width="220"
          height="440"
          viewBox="0 0 220 440"
          fill="none"
          aria-hidden="true"
        >
          <rect x="10" y="10" width="200" height="420" rx="100" fill="var(--color-pine-soft)" />
          <path d="M10 220h200" stroke="var(--color-ivory)" strokeWidth="4" />
          <rect x="10" y="10" width="200" height="205" rx="100" fill="var(--color-clay-soft)" />
        </svg>
      </section>

      {/* How it works */}
      <section className="bg-mist/60 border-y border-pine-soft">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-medium text-pine mb-14">How it works</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map(({ index, title, description, Icon }) => (
              <div key={index} className="relative pl-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-sm text-clay">{index}</span>
                  <span className="h-px flex-1 bg-pine-soft" aria-hidden="true" />
                  <Icon className="h-5 w-5 text-pine" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-medium text-pine mb-2">{title}</h3>
                <p className="text-ink-soft leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-ivory mb-5 text-balance">
            Ready to find your medicine?
          </h2>
          <p className="text-pine-soft leading-relaxed mb-10 max-w-xl mx-auto">
            Search across pharmacies to find the best prices and availability for what you need,
            right now.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-ivory text-pine px-8 py-4 rounded-full font-medium hover:bg-clay-soft transition-colors shadow-lifted"
          >
            Start searching
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Search, MapPinned, PackageCheck } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

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
      <header className="border-b border-pine-soft/60 bg-ivory/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="font-mono text-xs uppercase tracking-widest text-pine hover:text-pine-light transition-colors"
            >
              Search &rarr;
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link
                href="/search"
                className="group relative inline-flex items-center gap-3 bg-pine text-ivory pl-7 pr-6 py-4 rounded-full font-medium hover:bg-pine-light transition-colors shadow-card"
              >
                <span className="absolute inset-0 rounded-full pulse-ring" aria-hidden="true" />
                Start searching
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Signature capsule motif */}
        <motion.svg
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.9, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="hidden md:block absolute right-[-40px] top-1/2 -translate-y-1/2"
          width="220"
          height="440"
          viewBox="0 0 220 440"
          fill="none"
          aria-hidden="true"
        >
          <rect x="10" y="10" width="200" height="420" rx="100" fill="var(--color-pine-soft)" />
          <path d="M10 220h200" stroke="var(--color-ivory)" strokeWidth="4" />
          <rect x="10" y="10" width="200" height="205" rx="100" fill="var(--color-clay-soft)" />
        </motion.svg>
      </section>

      {/* How it works */}
      <section className="bg-mist/60 border-y border-pine-soft/60">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-medium text-pine mb-14">How it works</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map(({ index, title, description, Icon }, i) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                className="relative pl-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-sm text-clay">{index}</span>
                  <span className="h-px flex-1 bg-pine-soft" aria-hidden="true" />
                  <Icon className="h-5 w-5 text-pine" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-medium text-pine mb-2">{title}</h3>
                <p className="text-ink-soft leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="font-display text-3xl sm:text-4xl font-medium text-ivory mb-5 text-balance"
          >
            Ready to find your medicine?
          </motion.h2>
          <p className="text-pine-soft leading-relaxed mb-10 max-w-xl mx-auto">
            Search across pharmacies to find the best prices and availability for what you need,
            right now.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-ivory text-pine px-8 py-4 rounded-full font-medium hover:bg-clay-soft transition-colors shadow-lifted"
            >
              Start searching
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

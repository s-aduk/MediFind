'use client';

import { motion } from 'framer-motion';
import { Pill, MapPin, Clock, Phone, Navigation, CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

// Stock tone: color is always paired with an icon + text label, never used
// alone, per the existing accessibility floor for this app.
function stockTone(count) {
  if (count <= 0) {
    return { dot: 'text-brick', text: 'text-brick', chip: 'bg-brick-soft', Icon: XCircle, label: 'Out of stock', breathe: false };
  }
  if (count < 10) {
    return { dot: 'text-clay', text: 'text-clay', chip: 'bg-clay-soft', Icon: AlertCircle, label: `${count} left`, breathe: true };
  }
  return { dot: 'text-pine', text: 'text-pine', chip: 'bg-pine-soft', Icon: CheckCircle2, label: `${count} in stock`, breathe: true };
}

export const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

export const listContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

// Skeleton stand-in for a PharmacyCard while a search/fetch is in flight -
// same shape and rhythm as the real card so the layout doesn't jump when
// results arrive.
export function PharmacyCardSkeleton({ index = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      className="glass-card rounded-2xl shadow-card overflow-hidden"
      aria-hidden="true"
    >
      <div className="pl-6 pr-5 py-5">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="space-y-2 w-2/3">
            <div className="h-4 w-1/2 rounded skeleton-shimmer" />
            <div className="h-3 w-3/4 rounded skeleton-shimmer" />
          </div>
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-6 w-28 rounded-full skeleton-shimmer mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl skeleton-shimmer" style={{ animationDelay: `${(index + i) * 90}ms` }} />
          ))}
        </div>
        <div className="h-9 w-32 rounded-full skeleton-shimmer" />
      </div>
    </motion.div>
  );
}

export default function PharmacyCard({ pharmacy: pharm, onAction, actionLabel = 'Order now' }) {
  const stockCount = pharm.stock ?? pharm.quantity ?? 0;
  const tone = stockTone(stockCount);
  const { Icon: StockIcon } = tone;
  const name = pharm.pharmacy?.name || 'Pharmacy';
  const phone = pharm.pharmacy?.phone;
  const lat = pharm.pharmacy?.latitude;
  const lng = pharm.pharmacy?.longitude;
  const mapsHref =
    lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : pharm.pharmacy?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharm.pharmacy.address)}`
      : null;

  return (
    <motion.div
      variants={cardVariants}
      layout
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.995 }}
      className="glass-card group relative overflow-hidden rounded-2xl shadow-card hover:shadow-lifted transition-shadow"
    >
      {/* Stock gauge rail */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${tone.text.replace('text-', 'bg-')}`} aria-hidden="true" />

      <div className="pl-6 pr-5 py-5">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-medium text-pine truncate">{name}</h3>
            {pharm.pharmacy?.address && (
              <p className="text-sm text-ink-soft flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-clay shrink-0" aria-hidden="true" />
                <span className="truncate">{pharm.pharmacy.address}</span>
              </p>
            )}
          </div>

          <span className="shrink-0 inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full bg-mist text-pine">
            <Navigation className="h-3 w-3" aria-hidden="true" />
            {pharm.distance ? `${pharm.distance.toFixed(1)} km` : 'Nearby'}
          </span>
        </div>

        {/* Stock badge - breathing dot only animates while there's live
            stock; out-of-stock is a static, unambiguous icon instead. */}
        <div className={`inline-flex items-center gap-2 mb-4 pl-2 pr-3 py-1.5 rounded-full ${tone.chip}`}>
          <span className={`relative h-2 w-2 rounded-full ${tone.dot.replace('text-', 'bg-')} ${tone.breathe ? 'breathing-dot' : ''}`} aria-hidden="true" />
          <StockIcon className={`h-3.5 w-3.5 ${tone.text}`} aria-hidden="true" />
          <span className={`font-mono text-xs font-medium ${tone.text}`}>{tone.label}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl">
            <Pill className="h-4 w-4 text-clay shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ink-soft">Price</p>
              <p className="font-mono text-sm font-medium text-ink">
                {pharm.price ? `$${pharm.price.toFixed(2)}` : 'On request'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl">
            <Clock className="h-4 w-4 text-sage shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ink-soft">Updated</p>
              <p className="text-sm text-ink">
                {pharm.last_updated || pharm.updated_at
                  ? new Date(pharm.last_updated || pharm.updated_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl hover:bg-pine-soft/60 transition-colors"
            >
              <Phone className="h-4 w-4 text-sage shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Call</p>
                <p className="text-sm text-ink truncate">{phone}</p>
              </div>
            </a>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl opacity-60">
              <Phone className="h-4 w-4 text-sage shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-ink-soft">Call</p>
                <p className="text-sm text-ink">N/A</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction(pharm)}
            className="flex-1 sm:flex-none bg-pine text-ivory px-6 py-2.5 rounded-full font-medium hover:bg-pine-light transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.button>

          {mapsHref && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-pine-soft text-pine text-sm font-medium hover:bg-pine-soft/50 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              Directions
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

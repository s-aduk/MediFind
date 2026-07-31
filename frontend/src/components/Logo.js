import Link from 'next/link';

// Premium MediFind brand mark: Tightened bounding box + refined gradient fill
function CapsuleMark({ className = 'h-7 w-7' }) {
  return (
    <svg
      viewBox="120 56 272 338"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="medifindEmeraldGrad"
          x1="120"
          y1="56"
          x2="392"
          y2="394"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2F6B4F" />
          <stop offset="100%" stopColor="#1B4D3E" />
        </linearGradient>
        <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main M */}
      <path
        d="M120 392V224C120 210 131 200 144 200C153 200 161 204 166 212L256 332L346 212C351 204 359 200 368 200C381 200 392 210 392 224V392H352V282L274 385C270 391 263 394 256 394C249 394 242 391 238 385L160 282V392H120Z"
        fill="url(#medifindEmeraldGrad)"
      />

      {/* Map Pin */}
      <path
        d="M256 56C191 56 140 107 140 172C140 249 256 334 256 334C256 334 372 249 372 172C372 107 321 56 256 56Z"
        fill="url(#medifindEmeraldGrad)"
        filter="url(#subtleGlow)"
      />

      {/* Medical Cross */}
      <rect x="236" y="120" width="40" height="104" rx="8" fill="#F8F6F0" />
      <rect x="204" y="152" width="104" height="40" rx="8" fill="#F8F6F0" />

      {/* Leaf Accent */}
      <path
        d="M282 212C317 198 347 211 364 238C336 242 312 261 302 288C281 271 275 240 282 212Z"
        fill="#529864"
      />

      <path
        d="M305 280C316 255 336 239 360 235"
        stroke="#F8F6F0"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  href = '/',
  withWordmark = true,
  markClassName = 'h-8 w-8',
  className = '',
}) {
  const content = (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CapsuleMark className={markClassName} />
      {withWordmark && (
        <span className="font-display text-xl font-bold text-pine tracking-tight leading-none">
          MediFind
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="inline-flex items-center hover:opacity-90 transition-opacity focus-visible:outline-none"
    >
      {content}
    </Link>
  );
}
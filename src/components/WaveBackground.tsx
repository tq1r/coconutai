'use client';

export default function WaveBackground() {
  return (
    <div className="wave-container">
      <svg className="wave-svg wave-svg-1" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,80 L0,80 Z" fill="url(#wg1)" />
        <path d="M480,40 C720,0 960,80 1200,40 C1440,0 1680,80 1920,40 L1920,80 L480,80 Z" fill="url(#wg1)" />
        <path d="M960,40 C1200,0 1440,80 1680,40 C1920,0 2160,80 2400,40 L2400,80 L960,80 Z" fill="url(#wg1)" />
      </svg>
      <svg className="wave-svg wave-svg-2" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,30 C180,80 360,0 540,30 C720,80 900,0 1080,30 C1260,80 1440,0 1620,30 L1620,80 L0,80 Z" fill="url(#wg2)" />
        <path d="M540,30 C720,80 900,0 1080,30 C1260,80 1440,0 1620,30 C1800,80 1980,0 2160,30 L2160,80 L540,80 Z" fill="url(#wg2)" />
        <path d="M1080,30 C1260,80 1440,0 1620,30 C1800,80 1980,0 2160,30 C2340,80 2520,0 2700,30 L2700,80 L1080,80 Z" fill="url(#wg2)" />
      </svg>
      <svg className="wave-svg wave-svg-3" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wg3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,50 C120,20 240,70 360,50 C480,20 600,70 720,50 C840,20 960,70 1080,50 L1080,80 L0,80 Z" fill="url(#wg3)" />
        <path d="M360,50 C480,20 600,70 720,50 C840,20 960,70 1080,50 C1200,20 1320,70 1440,50 L1440,80 L360,80 Z" fill="url(#wg3)" />
        <path d="M720,50 C840,20 960,70 1080,50 C1200,20 1320,70 1440,50 C1560,20 1680,70 1800,50 L1800,80 L720,80 Z" fill="url(#wg3)" />
      </svg>
    </div>
  );
}

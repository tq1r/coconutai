'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const features = [
  { icon: '[AI]', title: 'Smart AI Models', desc: 'GPT-4o, Claude, Grok, Gemini — world-class models that actually generate production-ready Roblox code.', highlight: 'No slop, just clean Luau.' },
  { icon: '[~]', title: 'Studio Sync', desc: 'Install the Coconut AI plugin and push code directly to Roblox Studio. No copy-paste, no friction.', highlight: 'Plugin included.' },
  { icon: '[@]', title: 'Natural Chat', desc: 'Talk to the AI like a teammate. Ask questions, refine code, get explanations. It understands context.', highlight: 'Chat-first UX.' },
  { icon: '[#]', title: 'Full Game Systems', desc: 'Combat, UI, movement, economy, NPCs, towers, projectiles — generate entire systems in one prompt.', highlight: 'Ship faster.' },
  { icon: '[T]', title: '3 Dark Themes', desc: 'Coconut, Midnight, Obsidian — code in a visual environment that matches your vibe.', highlight: 'Your style.' },
  { icon: '[+]', title: 'Discord Premium', desc: 'Premium unlocked via Discord. No fake upgrade buttons. Pay once, get lifetime access.', highlight: 'Fair pricing.' },
];

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => { if (data?.success) setSignedIn(true); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-surface-solid)' }}>
      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 panel animate-slide-up" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-lg font-bold text-gradient-neon">Coconut AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {signedIn ? (
              <Link href="/projects" className="btn-neon no-underline text-sm" style={{ padding: '8px 18px', textDecoration: 'none' }}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>Sign In</Link>
                <Link href="/auth/signup" className="btn-neon no-underline text-sm" style={{ padding: '8px 18px', textDecoration: 'none' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="min-h-[90vh] flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-8" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
            [*] Built for Roblox creators
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-5" style={{ color: 'var(--text-primary)' }}>
            The AI that{' '}
            <span className="animate-gradient text-gradient-neon">
              actually builds
            </span>
            <br />
            Roblox games
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
            Not a slop machine. Coconut AI generates production-ready Luau code, understands your game&apos;s architecture,
            and syncs directly to Roblox Studio. Talk to it like a developer, not a search engine.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup" className="btn-neon text-base" style={{ padding: '14px 32px', textDecoration: 'none' }}>
              Start Building Free
            </Link>
            <a href="#features" className="text-sm font-medium no-underline px-6 py-3.5 rounded-xl border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              See Features &rarr;
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>&gt; No credit card</span>
            <span>&gt; 4 premium models free</span>
            <span>&gt; Studio plugin included</span>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-28 px-6" style={{ background: 'var(--bg-surface-solid)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything you need to ship
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              No fluff. Just tools that make you a faster, better Roblox developer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-2">
            {features.map((f, i) => (
              <div key={i} className="panel p-6 animate-slide-up animate-scale-hover" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{f.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>From prompt to Studio in seconds</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Three steps. No friction.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger-1">
            {[
              { step: '01', title: 'Describe', desc: 'Tell Coconut AI what you want — a combat system, a shop UI, or a full tower defense wave system.' },
              { step: '02', title: 'Generate', desc: 'Pick a model (GPT-4o, Claude, local TXMO) and get production-ready Luau code in seconds.' },
              { step: '03', title: 'Deploy', desc: 'Push directly to Roblox Studio with the Coconut AI plugin, or copy the code into your project.' },
            ].map((s, i) => (
              <div key={i} className="text-center animate-slide-up">
                <div className="text-3xl font-black mb-3" style={{ color: 'var(--accent)' }}>{s.step}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Models ────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: 'var(--bg-surface-solid)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Choose your model</h2>
          <p className="text-lg mb-12" style={{ color: 'var(--text-secondary)' }}>Each model runs on real inference. No fake fallbacks except TXMO (local).</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-1">
            {[
              { name: 'GPT-4o', plan: 'Premium', desc: 'Best for complex systems', tag: '*' },
              { name: 'Claude Sonnet', plan: 'Free', desc: 'Great price-performance', tag: '-' },
              { name: 'Grok-3', plan: 'Free', desc: 'Creative mechanics', tag: '-' },
              { name: 'TXMO', plan: 'Premium', desc: 'Local, no API key', tag: '*' },
            ].map((m, i) => (
              <div key={i} className="panel p-6 text-center animate-slide-up animate-scale-hover">
                <div className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>{m.tag === '*' ? '[*]' : '[-]'}</div>
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{m.name}</h3>
                <p className="label mb-1">{m.plan}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Simple, fair pricing</h2>
          <p className="text-lg mb-12" style={{ color: 'var(--text-secondary)' }}>No hidden tiers. No fake upgrade buttons. Premium managed via Discord.</p>
          <div className="grid sm:grid-cols-2 gap-6 stagger-1">
            {[
              { name: 'Free', price: '$0', credits: 'unlimited', models: 'Sonnet, Grok, Gemini, Mistral', studio: 'yes', badge: '[-]' },
              { name: 'Premium', price: 'one-time', credits: 'unlimited', models: 'GPT-4o, TXMO + all free models', studio: 'yes', badge: '[*]', note: 'via Discord /add' },
            ].map((tier, i) => (
              <div key={i} className={`panel p-8 text-left flex flex-col animate-slide-up ${i === 1 ? 'ring-2' : ''}`} style={{ borderColor: i === 1 ? 'var(--accent)' : undefined, background: 'var(--bg-elevated)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>{tier.badge} {tier.name}</div>
                <div className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{tier.price}</div>
                <ul className="space-y-2 text-sm mb-6 flex-1" style={{ color: 'var(--text-secondary)' }}>
                <li>&gt; {tier.credits} generations</li>
                <li>&gt; {tier.models}</li>
                <li>&gt; Studio sync: {tier.studio}</li>
                {tier.note && <li>&gt; {tier.note}</li>}
                </ul>
                <Link href="/auth/signup" className="btn-neon text-center no-underline w-full text-sm" style={{ padding: '10px 0', textDecoration: 'none' }}>
                  {i === 0 ? 'Get Started Free' : 'Join Premium'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: 'var(--bg-surface-solid)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-2xl font-black mb-6" style={{ color: 'var(--accent)' }}>[CA]</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ready to build something real?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>No credit card. No fake AI. Just a tool that actually helps you ship Roblox games.</p>
          <Link href="/auth/signup" className="btn-neon text-base" style={{ padding: '14px 36px', textDecoration: 'none' }}>
            Start Building Free &rarr;
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t py-6 px-6 text-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        Coconut AI for Roblox &middot; &copy; 2026 Coconut AI
      </footer>
    </div>
  );
}

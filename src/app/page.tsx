'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sand-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-sand-100/40">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl drop-shadow-sm">🥥</span>
            <span className="font-bold text-xl bg-gradient-to-r from-ocean-500 to-teal-400 bg-clip-text text-transparent">Coconut AI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-sm text-stone-500 hover:text-ocean-600 no-underline font-medium">Sign In</Link>
            <Link href="/auth/signup" className="text-sm bg-gradient-to-r from-ocean-400 to-teal-400 hover:from-ocean-500 hover:to-teal-500 text-white px-6 py-2 rounded-xl no-underline font-semibold shadow-md hover:shadow-lg transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6 drop-shadow-sm">🥥</div>
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-800 leading-tight mb-5">
            The AI-Powered<br />
            <span className="bg-gradient-to-r from-ocean-500 to-teal-400 bg-clip-text text-transparent">Roblox Creator OS</span>
          </h1>
          <p className="text-lg text-stone-400 leading-relaxed mb-10 max-w-lg mx-auto">
            Generate scripts, UI, VFX, and entire game systems in seconds.
            Choose from premium AI models. Sync directly to your Roblox Studio.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup" className="px-8 py-3.5 bg-gradient-to-r from-ocean-400 to-teal-400 text-white text-base rounded-xl font-semibold no-underline shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Start Creating Free 🌴
            </Link>
            <a href="#features" className="px-8 py-3.5 border-2 border-sand-200 text-stone-600 text-base rounded-xl font-medium no-underline hover:border-sand-300 transition-all bg-white/40 backdrop-blur-sm">Learn More</a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-800 mb-3">Why Coconut AI?</h2>
          <p className="text-stone-400 mb-14">Everything you need to build Roblox experiences faster</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🌊', title: 'Multi-Model AI', desc: 'GPT-4o, Claude, Gemini and more at your fingertips' },
              { emoji: '🏝️', title: 'Real-time Editor', desc: 'Full IDE with syntax highlighting and live preview' },
              { emoji: '🌴', title: 'Free to Start', desc: 'No credit card required. Just create and ship.' },
            ].map((f, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm border border-sand-100/60 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className="text-4xl mb-4 drop-shadow-sm">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-stone-700 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-md mx-auto text-center bg-white/50 backdrop-blur-sm border border-sand-100/60 rounded-3xl p-10 shadow-md">
          <div className="text-5xl mb-5 drop-shadow-sm">🌴</div>
          <h2 className="text-3xl font-bold text-stone-800 mb-3">Ready to build?</h2>
          <p className="text-stone-400 mb-8">Start creating Roblox experiences with AI. No credit card needed.</p>
          <Link href="/auth/signup" className="inline-block px-8 py-3.5 bg-gradient-to-r from-ocean-400 to-teal-400 text-white text-base rounded-xl font-semibold no-underline shadow-lg hover:shadow-xl transition-all">
            Start Free Today 🥥
          </Link>
        </div>
      </section>

      <footer className="border-t border-sand-100/40 py-8 px-6 text-center bg-white/30">
        <p className="text-sm text-stone-400">Made with 🥥 for the Roblox community &middot; &copy; 2026</p>
      </footer>
    </div>
  );
}

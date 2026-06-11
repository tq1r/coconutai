'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sand-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-sand-100">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🥥</span>
            <span className="font-bold text-lg text-ocean-600">Coconut AI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-sm text-stone-500 hover:text-ocean-600 no-underline">Sign In</Link>
            <Link href="/auth/signup" className="text-sm bg-ocean-500 hover:bg-ocean-600 text-white px-5 py-2 rounded-lg no-underline font-medium shadow-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🥥</div>
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-800 leading-tight mb-5">
            The AI-Powered<br />
            <span className="text-ocean-500">Roblox Creator OS</span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed mb-10 max-w-lg mx-auto">
            Generate scripts, UI, VFX, and entire game systems in seconds.
            Choose from premium AI models. Sync directly to your Roblox Studio.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup" className="px-8 py-3 bg-ocean-500 text-white text-base rounded-lg font-medium no-underline shadow-md hover:bg-ocean-600 transition-colors shadow-ocean-200">
              Start Creating Free
            </Link>
            <a href="#features" className="px-8 py-3 border-2 border-sand-200 text-stone-600 text-base rounded-lg font-medium no-underline hover:border-sand-300 transition-colors">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-800 mb-3">Why Coconut AI?</h2>
          <p className="text-stone-500 mb-14">Everything you need to build Roblox experiences faster</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🌊', title: 'Multi-Model AI', desc: 'GPT-4o, Claude, Gemini and more at your fingertips' },
              { emoji: '🏝️', title: 'Real-time Editor', desc: 'Full IDE with syntax highlighting and live preview' },
              { emoji: '🌴', title: 'Free to Start', desc: 'No credit card required. Just create and ship.' },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-sand-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-stone-700 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="text-5xl mb-5">🌴</div>
          <h2 className="text-3xl font-bold text-stone-800 mb-3">Ready to build?</h2>
          <p className="text-stone-500 mb-8">Start creating Roblox experiences with AI. No credit card needed.</p>
          <Link href="/auth/signup" className="inline-block px-8 py-3 bg-ocean-500 text-white text-base rounded-lg font-medium no-underline shadow-md hover:bg-ocean-600 transition-colors shadow-ocean-200">
            Start Free Today
          </Link>
        </div>
      </section>

      <footer className="border-t border-sand-100 py-8 px-6 text-center bg-white/50">
        <p className="text-sm text-stone-400">&copy; 2026 Coconut AI — Made with 🥥 for the Roblox community</p>
      </footer>
    </div>
  );
}

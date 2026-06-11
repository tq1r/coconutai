'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0b0a]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0b0a]/90 border-b border-[#2a2620]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-xl">🥥</span>
            <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">Coconut AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-xs text-sand-400 hover:text-white no-underline">Sign In</Link>
            <Link href="/auth/signup" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-md no-underline">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🥥</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-orange-300 bg-clip-text text-transparent">
              The AI-Powered Roblox Creator OS
            </span>
          </h1>
          <p className="text-base text-sand-400 leading-relaxed mb-8 max-w-lg mx-auto">
            Generate scripts, UI, VFX, and entire game systems in seconds.
            Choose from premium AI models. Sync directly to your Roblox Studio.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/signup" className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm rounded-lg font-medium no-underline hover:shadow-lg hover:shadow-cyan-500/20">
              Start Creating Free
            </Link>
            <button className="px-6 py-3 border border-[#2a2620] text-sand-300 text-sm rounded-lg font-medium bg-transparent hover:bg-[#1a1815]">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Why Coconut AI?</h2>
          <p className="text-sm text-sand-400 mb-12">Everything you need to build Roblox experiences faster</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🌊', title: 'Multi-Model AI', desc: 'GPT-4o, Claude, Gemini & more' },
              { icon: '🏝️', title: 'Real-time Editor', desc: 'Full IDE with line numbers & tab support' },
              { icon: '🌴', title: 'Free to Start', desc: 'No credit card required. Just create.' },
            ].map((f, i) => (
              <div key={i} className="bg-[#1a1815] border border-[#2a2620] rounded-lg p-6">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-sand-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#2a2620]">
        <div className="max-w-md mx-auto text-center">
          <div className="text-3xl mb-4">🌴</div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to build?</h2>
          <p className="text-sm text-sand-400 mb-6">Start creating Roblox experiences with AI.</p>
          <Link href="/auth/signup" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm rounded-lg font-medium no-underline hover:shadow-lg hover:shadow-cyan-500/20">
            Start Free Today
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#2a2620] py-6 px-6 text-center">
        <p className="text-xs text-sand-500">&copy; 2026 Coconut AI</p>
      </footer>
    </div>
  );
}

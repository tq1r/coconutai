'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0b0a] via-[#1a1815] to-[#0d0b0a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0d0b0a]/80 border-b border-[#2a2620]">
        <div className="w-full max-w-6xl mx-auto px-6 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🥥</span>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
              Coconut AI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sand-300 hover:text-white transition-colors text-sm">
              Features
            </a>
            <a href="#pricing" className="text-sand-300 hover:text-white transition-colors text-sm">
              Pricing
            </a>
            <a href="#models" className="text-sand-300 hover:text-white transition-colors text-sm">
              Models
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sand-300 hover:text-white transition-colors text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        {/* Background beach elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/3 left-[10%] w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/3 right-[10%] w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-orange-500/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-7xl mb-8"
          >
            🥥
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-orange-300 bg-clip-text text-transparent">
              The AI-Powered Roblox Creator OS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-sand-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Generate scripts, UI, VFX, and entire game systems in seconds. Choose from
            premium AI models. Sync directly to your Roblox Studio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all text-sm"
            >
              Start Creating Free
            </Link>
            <button className="px-8 py-4 border border-sand-600 text-sand-300 rounded-xl font-medium hover:bg-[#2a2620] transition-all text-sm">
              Watch Demo
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="w-full max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
          >
            Why Coconut AI?
          </motion.h2>
          <p className="text-center text-sand-400 mb-16 max-w-xl mx-auto text-sm">
            Everything you need to build Roblox experiences faster
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Multi-Model AI',
                desc: 'GPT-4o, Claude, Gemini, Mistral, DeepSeek & more',
                icon: '🌊',
              },
              {
                title: 'Real-time Editor',
                desc: 'Full IDE with syntax highlighting & live preview',
                icon: '🏝️',
              },
              {
                title: 'Free to Start',
                desc: 'No credit card required. Just create and code.',
                icon: '🌴',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="bg-[#1a1815] border border-[#2a2620] rounded-xl p-8 hover:border-cyan-700/50 transition-all"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-sand-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-24 px-6 relative">
        <div className="w-full max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
          >
            Supported AI Models
          </motion.h2>
          <p className="text-center text-sand-400 mb-16 max-w-xl mx-auto text-sm">
            Choose the best model for your workflow
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'GPT-4o', 'Claude Opus', 'Gemini Pro', 'Grok-3',
              'Claude Sonnet', 'Gemini Flash', 'DeepSeek', 'Mistral',
            ].map((model, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#1a1815] border border-[#2a2620] rounded-lg p-4 text-center hover:border-cyan-700/50 transition-all"
              >
                <p className="text-sand-200 text-sm font-medium">{model}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="w-full max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
          >
            Simple Pricing
          </motion.h2>
          <p className="text-center text-sand-400 mb-16 max-w-xl mx-auto text-sm">
            Start free, upgrade when you need more
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['Basic AI models', '10 generations/month', 'Community support'],
              },
              {
                name: 'Plus',
                price: '$9',
                features: ['Premium models', '100 generations/month', 'Priority support', 'Real-time sync'],
                highlighted: true,
              },
              {
                name: 'Pro',
                price: '$49',
                features: ['All models', 'Unlimited generations', 'Email support', 'Advanced tools'],
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`rounded-xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-cyan-900/30 to-orange-900/30 border border-cyan-700/50'
                    : 'bg-[#1a1815] border border-[#2a2620]'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-cyan-400 mb-6">
                  {plan.price}
                  <span className="text-sm text-sand-500 font-normal">/month</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-sand-300">
                      <span className="text-emerald-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                      : 'bg-[#2a2620] text-sand-300 hover:bg-[#3a3428]'
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl mx-auto text-center"
        >
          <div className="text-5xl mb-6">🌴</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to create magic?</h2>
          <p className="text-sand-400 mb-8 max-w-md mx-auto">
            Join the island. Start building Roblox experiences with AI.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all text-sm"
          >
            Start Free Today
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2620] py-8 px-6 text-center">
        <p className="text-sm text-sand-500">&copy; 2026 Coconut AI. Made with 🥥 by the island.</p>
      </footer>
    </div>
  );
}

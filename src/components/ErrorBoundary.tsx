'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback || (
        <div className="p-8 text-center text-sand-400">
          <p className="text-4xl mb-4">🥥</p>
          <p className="text-sm">Something went wrong. Check the console for details.</p>
          <pre className="mt-4 text-xs text-left bg-[#1a1815] p-4 rounded border border-[#2a2620] max-w-xl mx-auto overflow-auto">
            {this.state.error.message}
          </pre>
          <button onClick={() => { this.setState({ error: null }); window.location.href = '/dashboard'; }}
            className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded text-sm">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

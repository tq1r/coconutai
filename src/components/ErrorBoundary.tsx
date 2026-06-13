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
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-2xl font-bold mb-4" style={{ color: 'var(--accent)' }}>[!]</p>
          <p className="text-sm">Something went wrong. Check the console for details.</p>
          <pre className="mt-4 text-xs text-left p-4 rounded max-w-xl mx-auto overflow-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => { this.setState({ error: null }); window.location.href = '/dashboard'; }}
            className="btn-neon mt-4 text-sm">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

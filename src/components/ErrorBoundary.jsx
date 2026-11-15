import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#070b19] text-white p-6 text-center font-sans">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="text-base font-bold text-slate-100">
              HAVE2WANT PLUS — Recupero Sessione
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si è verificato un problema nel rendering della schermata.
            </p>
            {this.state.error?.message && (
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shadow-lg"
            >
              Ricarica Applicazione
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

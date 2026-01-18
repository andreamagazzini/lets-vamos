'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ERROR_MESSAGES } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-lg card-modern animate-fade-in">
            <h1 className="heading-lg text-black mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-gray-600 mb-6 body-md">
              {this.state.error?.message || ERROR_MESSAGES.GENERIC}
            </p>
            <div className="flex gap-4">
              <button onClick={this.handleReset} className="btn-primary flex-1" type="button">
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="btn-secondary flex-1"
                type="button"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-gray-50 rounded-lg">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

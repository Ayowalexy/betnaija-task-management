import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '240px',
          gap: '16px',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle
          size={40}
          style={{ color: 'var(--color-error)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Something went wrong
        </h2>
        {this.state.error && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
              maxWidth: '480px',
              fontFamily: 'var(--font-family-mono)',
              background: 'var(--color-bg-subtle)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error.message}
          </p>
        )}
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            padding: '0 16px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            fontFamily: 'var(--font-family-sans)',
            cursor: 'pointer',
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

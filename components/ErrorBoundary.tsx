import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="brand-page" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '40px',
            border: '2px solid var(--line, #ddd)',
            background: 'rgba(255, 255, 255, 0.8)',
          }}>
            <h1 style={{
              fontSize: '48px',
              marginBottom: '20px',
              fontFamily: 'serif',
              color: 'var(--ink, #222)',
            }}>
              [ ERROR ]
            </h1>
            <p style={{
              fontSize: '16px',
              marginBottom: '30px',
              lineHeight: '1.6',
              color: 'var(--ink, #222)',
            }}>
              Something went wrong. The application has encountered an unexpected error.
            </p>
            {this.state.error && (
              <div style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '15px',
                background: 'rgba(211, 47, 47, 0.1)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                marginBottom: '20px',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '150px',
              }}>
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleGoHome}
              className="brand-submit-btn"
              style={{
                fontSize: '14px',
                padding: '12px 30px',
              }}
            >
              [ GO HOME ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

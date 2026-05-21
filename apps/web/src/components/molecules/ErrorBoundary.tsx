import { Component } from 'react';
import type { ReactNode } from 'react';
import { Result } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Per-widget resilience (§8): one widget throwing must never blank the page. The redacting
// reportError() seam (§11) attaches here when the client logger lands; it must never log PHI.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <Result status="warning" title={this.props.fallbackTitle ?? 'This section ran into a problem'} />;
    }
    return this.props.children;
  }
}

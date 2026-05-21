import { Component } from 'react';
import ServerErrorView from './ServerErrorView';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    if (import.meta.env.DEV) {
      // Dev-only logging for debugging; production UI stays sanitized.
      console.error('SewaFi AppErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const details = import.meta.env.DEV
        ? `${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Unknown error'}\n${this.state.errorInfo?.componentStack || ''}`
        : '';

      return (
        <ServerErrorView
          onRetry={this.handleRetry}
          details={details}
          inBoundary
        />
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;

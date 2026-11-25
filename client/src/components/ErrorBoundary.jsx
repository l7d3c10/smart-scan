import { Component } from 'react';
import { StatusErrorPage } from '../pages/StatusErrorPage.jsx';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return <StatusErrorPage status={500} />;
    return this.props.children;
  }
}

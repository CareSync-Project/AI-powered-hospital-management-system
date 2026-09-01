import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { if (import.meta.env.DEV) console.error('CareSync page error', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="route-message" role="alert"><h1>This page could not be displayed</h1><p>An unexpected interface error occurred. Your server data was not changed.</p><button onClick={() => { this.setState({ error: null }); window.location.assign('/'); }}>Return to CareSync</button></main>;
  }
}

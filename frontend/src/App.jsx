import React from 'react';
import Chat from './components/Chat';
import './index.css';

function App() {
  console.log('🎯 App component rendering...');
  
  return (
    <div className="app">
      <Chat />
    </div>
  );
}

// Add error boundary for better debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          background: '#ffebee',
          color: '#c62828'
        }}>
          <h2>Something went wrong</h2>
          <p>Check the browser console for errors</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap App with error boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
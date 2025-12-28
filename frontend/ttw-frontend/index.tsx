import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40, fontSize: 20, color: 'red' }}>
      <h2>🔥 Error en la aplicación</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppWrapper />
    </ErrorBoundary>
  </React.StrictMode>
);
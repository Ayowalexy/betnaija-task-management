import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export function NotFoundPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
    ? error.message
    : 'An unexpected error occurred';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      background: 'var(--color-bg-base)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-family-sans)',
      padding: 'var(--space-8)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>⚠️</div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 400 }}>{message}</p>
      <Link
        to="/dashboard"
        style={{
          padding: '10px 20px',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginTop: 'var(--space-2)',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-base p-4">
      <h1 className="font-display text-4xl font-bold text-text-primary mb-4">404</h1>
      <p className="text-text-secondary mb-6">Page not found</p>
      <Link
        to="/"
        className="bg-accent hover:bg-accent-hover text-white font-medium py-2 px-6 rounded-button transition-duration-micro"
      >
        Go Home
      </Link>
    </div>
  );
}

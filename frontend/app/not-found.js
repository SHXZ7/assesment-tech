import Link from "next/link";
import ThemeToggle from "@/src/components/ui/ThemeToggle";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="login-page-header">
        <ThemeToggle />
      </div>
      <span className="not-found-bg" aria-hidden="true">
        404
      </span>
      <div className="not-found-content">
        <h1>Page not found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link className="primary-button" href="/">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

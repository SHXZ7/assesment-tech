import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div>
          <p className="eyebrow">404</p>
          <h1>Page Not Found</h1>
        </div>
        <Link className="primary-button" href="/">
          Back to Login
        </Link>
      </section>
    </main>
  );
}

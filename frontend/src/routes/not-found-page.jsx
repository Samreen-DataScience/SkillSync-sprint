import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <div className="text-8xl font-black text-slate-200">404</div>
      <h1 className="text-2xl font-bold text-slate-700">Page Not Found</h1>
      <p className="text-slate-500">The page you're looking for doesn't exist.</p>
      <Link
        to="/dashboard"
        className="rounded-lg px-6 py-2 text-white font-semibold"
        style={{ background: "#dc2626" }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

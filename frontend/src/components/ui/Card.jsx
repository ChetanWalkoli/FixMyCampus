export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between border-b border-slate-100 px-5 py-3.5 ${className}`}
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

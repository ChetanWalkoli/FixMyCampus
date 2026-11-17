import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Alert({ variant = "error", children, className = "" }) {
  if (!children) return null;

  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const styles = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${styles} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "neutral", loading }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    brand: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && (
          <div className={`rounded-md p-1.5 ${tones[tone] || tones.neutral}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {loading ? (
          <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-200" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100 px-5 py-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between py-3.5">
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

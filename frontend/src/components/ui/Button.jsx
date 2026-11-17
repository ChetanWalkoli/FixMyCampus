export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600/30 border border-transparent",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus-visible:ring-slate-400/30",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/30 border border-transparent",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600/30 border border-transparent",
    dangerSoft:
      "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 focus-visible:ring-rose-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

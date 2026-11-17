const baseFieldClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 disabled:bg-slate-100 disabled:text-slate-500";

export function FieldLabel({ htmlFor, children, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium text-slate-700 ${className}`}
    >
      {children}
    </label>
  );
}

export function Input({ id, label, className = "", ...props }) {
  return (
    <div>
      {label && (
        <FieldLabel htmlFor={id} className="mb-1.5">
          {label}
        </FieldLabel>
      )}
      <input id={id} className={`${baseFieldClass} ${className}`} {...props} />
    </div>
  );
}

export function Select({ id, label, className = "", children, ...props }) {
  return (
    <div>
      {label && (
        <FieldLabel htmlFor={id} className="mb-1.5">
          {label}
        </FieldLabel>
      )}
      <select id={id} className={`${baseFieldClass} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({ id, label, className = "", ...props }) {
  return (
    <div>
      {label && (
        <FieldLabel htmlFor={id} className="mb-1.5">
          {label}
        </FieldLabel>
      )}
      <textarea
        id={id}
        className={`${baseFieldClass} ${className}`}
        {...props}
      />
    </div>
  );
}

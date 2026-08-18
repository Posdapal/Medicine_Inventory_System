import { AlertCircle, Check } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg shadow-teal-950/20",
    secondary: "border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700",
    danger: "bg-rose-500 text-white hover:bg-rose-400",
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        className={`min-h-12 w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-4 text-sm text-slate-100 shadow-inner shadow-black/10 outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-teal-400/70 focus:bg-slate-800 focus:ring-4 focus:ring-teal-400/10 ${className}`}
        {...props}
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Card({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20 ${className}`}>
      {children}
    </section>
  );
}

export function Alert({ title, children, action }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
          <AlertCircle size={20} />
        </span>
        <div>
          <p className="font-semibold text-amber-400">{title}</p>
          <p className="mt-0.5 text-sm text-amber-400">{children}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-1.5" role="tablist">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onChange(key)}
          className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            active === key
              ? "bg-slate-800 text-teal-300 shadow-sm"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          }`}
        >
          {Icon && <Icon size={16} />}
          {label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "success" }) {
  const tones = {
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    neutral: "border-slate-700 bg-slate-800 text-slate-300",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function SidebarItem({ icon: Icon, label, active, nested = false, suffix, collapsed = false, ...props }) {
  return (
    <button
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? "bg-teal-50 font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/30 dark:bg-slate-900 dark:bg-gradient-to-r dark:from-teal-500/20 dark:to-cyan-500/5 dark:text-teal-200 dark:ring-teal-400/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
      } ${nested ? "pl-4" : ""} ${collapsed ? "justify-center px-0" : ""}`}
      {...props}
    >
      {active && <span className="absolute left-0 h-5 w-0.5 rounded-r bg-teal-400" />}
      {Icon && <Icon size={18} className={active ? "text-teal-700 dark:text-teal-300" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"} />}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && suffix}
    </button>
  );
}

export function ChecklistItem({ valid, children }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${valid ? "text-emerald-300" : "text-slate-500"}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${valid ? "bg-emerald-400/15" : "bg-slate-800"}`}>
        <Check size={10} />
      </span>
      {children}
    </li>
  );
}

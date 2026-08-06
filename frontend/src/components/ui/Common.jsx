// components/ui/common.jsx
// Shared building blocks used across all inventory pages.
// Extracted from the original Products/Suppliers pages — styling is untouched.
import { Search, Plus, X, Upload, Download, FileSpreadsheet, FileText, Printer, ChevronRight } from "lucide-react";

export function PageHeader({ title, subtitle, description, action, onAdd, addLabel }) {
  const crumbs = subtitle?.includes("/") ? subtitle.split("/").map((item) => item.trim()) : [];
  const supportingText = description || (crumbs.length === 0 ? subtitle : "");

  return (
    <header className="mb-6 rounded-2xl border border-[#1E2A45] bg-[#111A2C]/90 px-5 py-5 shadow-xl shadow-black/10 sm:px-6">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#7D8AA3]">
          {crumbs.map((crumb, index) => (
            <span key={crumb} className="contents">
              {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
              <span className={index === crumbs.length - 1 ? "text-teal-400" : ""}>{crumb}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#E7ECF6]">{title}</h1>
          {supportingText && <p className="mt-1 text-sm text-[#8B96AE]">{supportingText}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-teal-950/30 transition-colors hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-[#111A2C]"
            >
              <Plus size={16} strokeWidth={2.5} /> {addLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`bg-[#141E33] border border-[#1E2A45] rounded-xl ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Table({ columns, rows, emptyLabel = "No records match your search." }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Toolbar({ query, setQuery, placeholder, onAdd, addLabel, extra }) {
  return (
    <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
      <div className="relative w-full max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {extra}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={15} /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Secondary (outline-style) action button used for Import / Export / Download Template / Print
export function ActionButton({ icon: Icon, label, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className="flex items-center gap-1.5 border border-[#1E2A45] bg-[#0F1626] hover:bg-white/[0.04] transition-colors text-[#C9D2E3] text-sm font-medium px-3.5 py-2 rounded-lg"
    >
      {Icon && <Icon size={15} />} {label}
    </button>
  );
}

export function ImportButton({ label = "Import", onImport, accept = ".csv" }) {
  return (
    <label
      title={label}
      className="flex items-center gap-1.5 border border-[#1E2A45] bg-[#0F1626] hover:bg-white/[0.04] transition-colors text-[#C9D2E3] text-sm font-medium px-3.5 py-2 rounded-lg cursor-pointer"
    >
      <Upload size={15} /> {label}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onImport) onImport(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function ExportGroup({ onExportExcel, onExportPdf, onPrint }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {onExportExcel && <ActionButton icon={FileSpreadsheet} label="Export Excel" onClick={onExportExcel} />}
      {onExportPdf && <ActionButton icon={FileText} label="Export PDF" onClick={onExportPdf} />}
      {onPrint && <ActionButton icon={Printer} label="Print" onClick={onPrint} />}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2A45]">
          <h3 className="text-lg font-medium text-[#E7ECF6]">{title}</h3>
          <button onClick={onClose} className="text-[#5D6B85] hover:text-[#E7ECF6] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40";

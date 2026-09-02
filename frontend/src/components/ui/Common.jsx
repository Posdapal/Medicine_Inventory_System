// components/ui/common.jsx
// Shared building blocks used across all inventory pages.
// Extracted from the original Products/Suppliers pages — styling is untouched.
import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, X, Upload, Download, FileSpreadsheet, FileText, Printer, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays, Columns3, Check } from "lucide-react";

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
    info: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ColumnVisibilityControl({ columns, hiddenColumns, setHiddenColumns, visibleColumns, isRowNumberVisible, rowNumberKey, toggleColumn }) {
  return (
    <details className="group relative">
      <summary aria-label="Hide or show columns" className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[#2A3A5A] bg-[#111A2C] text-[#B8C3D6] shadow-sm transition hover:border-teal-500/60 hover:bg-teal-500/10 hover:text-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 after:pointer-events-none after:absolute after:right-0 after:top-full after:z-40 after:mt-2 after:hidden after:whitespace-nowrap after:rounded-md after:bg-slate-950 after:px-2.5 after:py-1.5 after:text-xs after:font-medium after:text-white after:content-['Hide_/_show_columns'] hover:after:block">
        <Columns3 size={19} aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-[#2A3A5A] bg-[#111A2C] p-2 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7D8AA3]">Visible columns</p>
            <p className="mt-0.5 text-xs text-[#5D6B85]">{visibleColumns.length + (isRowNumberVisible ? 1 : 0)} of {columns.length + 1} shown</p>
          </div>
          {hiddenColumns.length > 0 && <button type="button" onClick={() => setHiddenColumns([])} className="text-xs font-semibold text-teal-400 hover:text-teal-300">Show all</button>}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {[{ key: rowNumberKey, label: "No." }, ...columns].map((column) => {
            const isVisible = !hiddenColumns.includes(column.key);
            return (
              <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#D7DEEB] transition hover:bg-white/[0.05]">
                <input type="checkbox" checked={isVisible} onChange={() => toggleColumn(column.key)} className="sr-only" />
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${isVisible ? "border-teal-500 bg-teal-500 text-white" : "border-[#465572] bg-[#0F1626]"}`}>
                  {isVisible && <Check size={12} />}
                </span>
                {column.label}
              </label>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function Table({ columns, rows, emptyLabel = "No records match your search.", rowOffset = 0 }) {
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [toolbarTarget, setToolbarTarget] = useState(null);
  const rowNumberKey = "__rowNumber";
  const isRowNumberVisible = !hiddenColumns.includes(rowNumberKey);
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

  useEffect(() => {
    setToolbarTarget(document.querySelector("[data-table-column-controls]"));
  }, []);

  const toggleColumn = (key) => {
    setHiddenColumns((current) => {
      if (current.includes(key)) return current.filter((columnKey) => columnKey !== key);
      if (current.length >= columns.length) return current;
      return [...current, key];
    });
  };

  return (
    <div>
      {toolbarTarget ? createPortal(
        <ColumnVisibilityControl {...{ columns, hiddenColumns, setHiddenColumns, visibleColumns, isRowNumberVisible, rowNumberKey, toggleColumn }} />,
        toolbarTarget
      ) : (
        <div className="mb-3 flex justify-end">
          <ColumnVisibilityControl {...{ columns, hiddenColumns, setHiddenColumns, visibleColumns, isRowNumberVisible, rowNumberKey, toggleColumn }} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              {isRowNumberVisible && <th className="w-16 px-4 py-3 font-medium">No.</th>}
              {visibleColumns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
                {isRowNumberVisible && <td className="w-16 px-4 py-3 font-medium tabular-nums text-[#8B96AE]">{rowOffset + i + 1}</td>}
                {visibleColumns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + (isRowNumberVisible ? 1 : 0)} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
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
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {extra}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={15} /> {addLabel}
          </button>
        )}
        <div data-table-column-controls className="flex items-center" />
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

export function Modal({ isOpen, onClose, title, children, wide = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full ${wide ? "max-w-6xl" : "max-w-md"} max-h-[92vh] bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-auto`}>
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

export function FormField({ label, children, required = false, error, errorId }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium capitalize text-slate-700 dark:text-[#CBD5E1]">
        {label}{required && <span className="ml-1 text-[#EF4444]" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  const pageSizeMenuRef = useRef(null);
  if (!total) return null;
  const pageItems = [];
  for (let current = 1; current <= totalPages; current += 1) {
    if (current === 1 || current === totalPages || Math.abs(current - page) <= 1) pageItems.push(current);
    else if (pageItems[pageItems.length - 1] !== "ellipsis") pageItems.push("ellipsis");
  }
  const buttonClass = "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border px-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40";
  const defaultButtonClass = `${buttonClass} border-[#E2E8F0] bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1] dark:border-[#334155] dark:bg-transparent dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#E2E8F0] dark:disabled:bg-[#111827] dark:disabled:text-[#475569]`;
  return (
    <nav aria-label="Table pagination" className="mt-5 flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm shadow-sm shadow-slate-200/70 dark:border-[#1E293B] dark:bg-[#0F172A] dark:shadow-lg dark:shadow-black/20 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-start">
        <div className="flex items-center gap-2 font-medium text-[#334155] dark:text-[#E2E8F0]">
          <span>Rows per page</span>
          <details ref={pageSizeMenuRef} className="group relative">
            <summary aria-label={`Rows per page: ${limit}`} className="flex h-10 min-w-28 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-white px-3 font-semibold text-[#334155] shadow-sm transition hover:border-[#14B8A6] hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 dark:border-[#334155] dark:bg-[#111827] dark:text-[#E2E8F0] dark:hover:bg-[#1E293B]">
              <span>{limit} rows</span>
              <ChevronDown size={16} className="text-[#64748B] transition-transform group-open:rotate-180 dark:text-[#94A3B8]" aria-hidden="true" />
            </summary>
            <div className="absolute bottom-full left-0 z-30 mb-2 w-full min-w-32 rounded-xl border border-[#CBD5E1] bg-white p-1.5 shadow-xl shadow-slate-300/50 dark:border-[#334155] dark:bg-[#111827] dark:shadow-black/30">
              {[10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onLimitChange(size);
                    pageSizeMenuRef.current?.removeAttribute("open");
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${size === limit ? "bg-[#14B8A6] text-white" : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#E2E8F0]"}`}
                >
                  {size} rows
                  {size === limit && <Check size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button type="button" onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="First page" title="First page" className={`${defaultButtonClass} px-2.5`}><ChevronsLeft size={17} /></button>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className={defaultButtonClass}><ChevronLeft size={17} /><span className="hidden md:inline">Previous</span></button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-1 text-[#64748B] dark:text-[#94A3B8]">…</span> : (
            <button key={item} type="button" onClick={() => onPageChange(item)} aria-current={item === page ? "page" : undefined} className={item === page ? `${buttonClass} border-[#14B8A6] bg-[#14B8A6] text-white shadow-md shadow-teal-950/30 hover:bg-[#0F9D8A]` : defaultButtonClass}>{item}</button>
          ))}
        </div>
        <span className="min-w-16 text-center font-semibold text-[#334155] dark:text-[#E2E8F0] sm:hidden">{page} / {totalPages}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page" className={defaultButtonClass}><span className="hidden md:inline">Next</span><ChevronRight size={17} /></button>
        <button type="button" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} aria-label="Last page" title="Last page" className={`${defaultButtonClass} px-2.5`}><ChevronsRight size={17} /></button>
      </div>
    </nav>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#334155] dark:bg-[#111827] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8] dark:focus:border-[#14B8A6] dark:focus:ring-[#14B8A6]/20";

function validationMessage(control, label) {
  const { validity } = control;
  if (validity.valueMissing) return `${label} is required.`;
  if (validity.typeMismatch) return `Enter a valid ${label.toLowerCase()}.`;
  if (validity.tooShort) return `${label} must be at least ${control.minLength} characters.`;
  if (validity.tooLong) return `${label} must be no more than ${control.maxLength} characters.`;
  if (validity.rangeUnderflow) return `${label} must be at least ${control.min}.`;
  if (validity.rangeOverflow) return `${label} must be no more than ${control.max}.`;
  if (validity.stepMismatch) return `Enter a valid ${label.toLowerCase()}.`;
  if (validity.patternMismatch) return control.title || `${label} has an invalid format.`;
  return control.validationMessage || `${label} is invalid.`;
}

export function FormInput({ label, required = false, hint, error, className = "", trailingAction, onInvalid, onInput, ...props }) {
  const [nativeError, setNativeError] = useState("");
  const errorId = useId();
  const displayedError = error || nativeError;

  const handleInvalid = (event) => {
    event.preventDefault();
    setNativeError(validationMessage(event.currentTarget, label));
    onInvalid?.(event);
  };

  const handleInput = (event) => {
    if (nativeError) setNativeError(event.currentTarget.validity.valid ? "" : validationMessage(event.currentTarget, label));
    onInput?.(event);
  };

  return (
    <FormField label={label} required={required} error={displayedError} errorId={errorId}>
      <div className="relative">
        <input
          {...props}
          lang={props.type === "date" ? (props.lang || "en-CA") : props.lang}
          required={required}
          onInvalid={handleInvalid}
          onInput={handleInput}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={displayedError ? errorId : undefined}
          className={`${inputClass} ${trailingAction ? "pr-11" : ""} ${displayedError ? "border-rose-500/70 focus:ring-rose-500/30" : ""} ${className}`}
        />
        {trailingAction && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailingAction}
          </div>
        )}
      </div>
      {hint && !displayedError && <p className="mt-1.5 text-xs text-[#697791]">{hint}</p>}
    </FormField>
  );
}

export function FormSelect({ label, required = false, placeholder, hint, error, children, className = "", onInvalid, onInput, ...props }) {
  const [nativeError, setNativeError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const errorId = useId();
  const listboxId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const displayedError = error || nativeError;
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      value: String(child.props.value ?? ""),
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
    }));
  const selectedIndex = options.findIndex((option) => option.value === String(props.value ?? ""));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen) setActiveIndex(selectedIndex >= 0 ? selectedIndex : Math.max(0, options.findIndex((option) => !option.disabled)));
  }, [isOpen, selectedIndex]);

  const handleInvalid = (event) => {
    event.preventDefault();
    setNativeError(validationMessage(event.currentTarget, label));
    buttonRef.current?.focus();
    onInvalid?.(event);
  };

  const handleInput = (event) => {
    if (nativeError) setNativeError(event.currentTarget.validity.valid ? "" : validationMessage(event.currentTarget, label));
    onInput?.(event);
  };

  const selectOption = (option) => {
    if (!option || option.disabled) return;
    setNativeError("");
    props.onChange?.({ target: { value: option.value }, currentTarget: { value: option.value } });
    setIsOpen(false);
  };

  const moveActive = (direction) => {
    if (!options.length) return;
    let next = activeIndex;
    do next = (next + direction + options.length) % options.length;
    while (options[next]?.disabled && next !== activeIndex);
    setActiveIndex(next);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" || event.key === "Tab") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      else moveActive(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (isOpen && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (isOpen && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      const available = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
      setActiveIndex(event.key === "Home" ? available[0]?.index ?? 0 : available.at(-1)?.index ?? 0);
    }
  };

  return (
    <FormField label={label} required={required} error={displayedError} errorId={errorId}>
      <div ref={containerRef} className="relative">
        <select
          {...props}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          onInvalid={handleInvalid}
          onInput={handleInput}
          className="pointer-events-none absolute h-px w-px opacity-0"
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {children}
        </select>
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-label={label}
          aria-required={required}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={displayedError ? errorId : undefined}
          disabled={props.disabled || !options.length}
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={handleKeyDown}
          className={`${inputClass} flex items-center justify-between text-left ${displayedError ? "border-rose-500/70 focus:ring-rose-500/30" : ""} ${className}`}
        >
          <span className={selectedOption ? "truncate" : "truncate text-slate-400 dark:text-[#94A3B8]"}>{selectedOption?.label || placeholder}</span>
          <ChevronDown size={16} className={`ml-2 shrink-0 text-[#64748B] transition-transform dark:text-[#94A3B8] ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {isOpen && (
          <div id={listboxId} role="listbox" aria-label={label} className="absolute left-0 top-full z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-300/40 dark:border-[#334155] dark:bg-[#111827] dark:shadow-black/30">
            {options.map((option, index) => {
              const isSelected = option.value === String(props.value ?? "");
              const isActive = index === activeIndex;
              return (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? "bg-[#14B8A6] text-white" : isActive ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-transparent text-[#334155] dark:text-[#CBD5E1]"}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={15} className="shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {hint && !displayedError && <p className="mt-1.5 text-xs text-[#697791]">{hint}</p>}
    </FormField>
  );
}

export function FormDatePicker({ label, required = false, error, className = "", value, onChange, onInvalid, ...props }) {
  const [nativeError, setNativeError] = useState("");
  const inputRef = useRef(null);
  const errorId = useId();
  const displayedError = error || nativeError;

  const handleInvalid = (event) => {
    event.preventDefault();
    setNativeError(validationMessage(event.currentTarget, label));
    onInvalid?.(event);
  };

  const handleChange = (event) => {
    setNativeError("");
    onChange?.(event);
  };

  return (
    <FormField label={label} required={required} error={displayedError} errorId={errorId}>
      <div className={`relative ${className}`}>
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => {
            try {
              if (typeof inputRef.current?.showPicker === "function") inputRef.current.showPicker();
              else inputRef.current?.click();
            } catch {
              inputRef.current?.click();
            }
          }}
          aria-label={`${label}: ${value || "YYYY-MM-DD"}`}
          className={`${inputClass} flex items-center justify-between text-left ${displayedError ? "border-rose-500/70" : ""}`}
        >
          <span className={value ? "text-[#E7ECF6]" : "text-[#5D6B85]"}>{value || "YYYY-MM-DD"}</span>
          <CalendarDays size={17} className="text-[#8B96AE]" />
        </button>
        <input
          ref={inputRef}
          {...props}
          type="date"
          lang="en-CA"
          required={required}
          value={value}
          onChange={handleChange}
          onInvalid={handleInvalid}
          aria-label={label}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={displayedError ? errorId : undefined}
          tabIndex={-1}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      </div>
    </FormField>
  );
}

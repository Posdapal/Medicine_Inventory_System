import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { reportsApi } from "../../api/endpoints";
import { Card, FormDatePicker, PageHeader, Table } from "../../components/ui/Common";
import { downloadExcel } from "../../utils/ExportUtils";
import { toast } from "../../utils/toast";

const REPORT_TYPES = [
  { value: "products", label: "Products", columns: [["product_code", "Code"], ["product_name", "Product Name"], ["generic_name", "Generic Name"], ["category", "Category"], ["unit", "Unit"], ["minimum_stock", "Min Stock"], ["status", "Status"], ["created_date", "Created Date"]] },
  { value: "categories", label: "Categories", columns: [["name", "Name"], ["description", "Description"], ["status", "Status"], ["created_date", "Created Date"]] },
  { value: "units", label: "Units", columns: [["name", "Name"], ["abbreviation", "Abbreviation"], ["created_date", "Created Date"]] },
  { value: "suppliers", label: "Suppliers", columns: [["supplier_code", "Code"], ["supplier_name", "Supplier Name"], ["contact_name", "Contact"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"], ["status", "Status"], ["created_date", "Created Date"]] },
  { value: "stock_in", label: "Stock In", columns: [["transaction_number", "Transaction No."], ["transaction_date", "Date"], ["product", "Product"], ["supplier", "Supplier"], ["batch_number", "Batch No."], ["quantity", "Quantity"], ["unit_price", "Unit Price"]] },
  { value: "stock_out", label: "Stock Out", columns: [["transaction_number", "Transaction No."], ["transaction_date", "Date"], ["product", "Product"], ["batch_number", "Batch No."], ["quantity", "Quantity"], ["reason", "Reason"]] },
  { value: "current_stock", label: "Current Stock", columns: [["product_code", "Code"], ["product_name", "Product Name"], ["category", "Category"], ["unit", "Unit"], ["available_quantity", "Available Qty"], ["minimum_stock", "Min Stock"], ["stock_status", "Status"]] },
  { value: "stock_movement", label: "Stock History", columns: [["date", "Date"], ["product", "Product"], ["batch_number", "Batch No."], ["movement_type", "Movement Type"], ["quantity_before", "Qty Before"], ["movement_quantity", "Movement Qty"], ["quantity_after", "Qty After"]] },
  { value: "low_stock", label: "Low Stock", columns: [["product_code", "Code"], ["product_name", "Product Name"], ["category", "Category"], ["unit", "Unit"], ["available_quantity", "Available Qty"], ["minimum_stock", "Min Stock"], ["stock_status", "Status"]] },
  { value: "near_expiry", label: "Near Expiry", columns: [["product", "Product"], ["batch_number", "Batch No."], ["manufacture_date", "Manufacture Date"], ["expiry_date", "Expiry Date"], ["days_remaining", "Days Remaining"], ["available_quantity", "Available Qty"]] },
  { value: "expired_products", label: "Expired Batches", columns: [["product", "Product"], ["batch_number", "Batch No."], ["manufacture_date", "Manufacture Date"], ["expiry_date", "Expiry Date"], ["days_expired", "Days Expired"], ["available_quantity", "Available Qty"]] },
  { value: "users", label: "Users", columns: [["full_name", "Full Name"], ["username", "Username"], ["email", "Email"], ["role", "Role"], ["status", "Status"], ["created_date", "Created Date"]] },
];

function ReportTypeSelect({ value, onChange }) {
  const menuRef = useRef(null);
  const selected = REPORT_TYPES.find((type) => type.value === value);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#8B96AE]">Report Type <span className="text-rose-400">*</span></label>
      <details ref={menuRef} className="group relative z-30 open:z-50">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[#2A3A5A] bg-[#0F1626] px-3.5 text-sm font-semibold text-[#E7ECF6] shadow-sm transition hover:border-blue-500/60 hover:bg-blue-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <span className="flex min-w-0 items-center gap-2.5"><FileSpreadsheet size={17} className="shrink-0 text-emerald-400" /><span className="truncate">{selected.label}</span></span>
          <ChevronDown size={16} className="shrink-0 text-[#7D8AA3] transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-[#2A3A5A] bg-[#111A2C] p-2 shadow-2xl shadow-black/40">
          <div className="mb-1 px-2 py-1.5"><p className="text-xs font-semibold uppercase tracking-wide text-[#7D8AA3]">Choose a module</p><p className="mt-0.5 text-xs text-[#5D6B85]">The exported columns match its table.</p></div>
          <div className="max-h-72 overflow-y-auto pr-1">
            {REPORT_TYPES.map((type) => {
              const active = type.value === value;
              return <button key={type.value} type="button" onClick={() => { onChange(type.value); menuRef.current?.removeAttribute("open"); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active ? "bg-blue-500/15 text-blue-300" : "text-[#D7DEEB] hover:bg-white/[0.05]"}`}><span>{type.label}</span>{active && <Check size={15} />}</button>;
            })}
          </div>
        </div>
      </details>
    </div>
  );
}

function displayValue(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  if (key.includes("date") && typeof value === "string") return value.slice(0, 10);
  if (key === "unit_price") return `$${Number(value).toFixed(2)}`;
  if (["status", "stock_status", "movement_type"].includes(key)) {
    return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return value;
}

export default function Reports() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const definition = useMemo(() => REPORT_TYPES.find((type) => type.value === reportType), [reportType]);
  const tableColumns = useMemo(() => definition.columns.map(([key, label]) => ({ key, label, render: (row) => displayValue(row[key], key) })), [definition]);

  const fetchReport = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setRecords([]);
      setError("From date must be before or equal to To date.");
      return null;
    }
    setError("");
    const response = await reportsApi.generate({ report_type: reportType, date_range_start: dateFrom || undefined, date_range_end: dateTo || undefined });
    const nextRecords = response.data?.data || [];
    setRecords(nextRecords);
    return nextRecords;
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      if (dateFrom && dateTo && dateFrom > dateTo) {
        if (active) {
          setRecords([]);
          setError("From date must be before or equal to To date.");
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const response = await reportsApi.generate(
          { report_type: reportType, date_range_start: dateFrom || undefined, date_range_end: dateTo || undefined },
          { signal: controller.signal }
        );
        if (active) { setRecords(response.data?.data || []); setError(""); }
      } catch (requestError) {
        if (active && !controller.signal.aborted) { setRecords([]); setError(requestError.message); }
      } finally {
        if (active) setLoading(false);
      }
    }, 500);
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [reportType, dateFrom, dateTo]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const latestRecords = await fetchReport();
      if (!latestRecords) return;
      const excelRows = latestRecords.map((record) => definition.columns.map(([key]) => displayValue(record[key], key)));
      const suffix = dateFrom || dateTo ? `-${dateFrom || "start"}-to-${dateTo || "today"}` : "";
      downloadExcel(`${reportType}${suffix}.xlsx`, definition.label, definition.columns.map(([, label]) => label), excelRows);
      toast.success(`${definition.label} report generated.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Reports / Generate" description="Filter module records and export the same table format to Excel." />

      <Card className="relative z-20 mb-5 overflow-visible p-5">
        <div className="grid items-end gap-4" style={{ gridTemplateColumns: "minmax(260px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr) 150px" }}>
          <div><ReportTypeSelect value={reportType} onChange={setReportType} /></div>
          <div><FormDatePicker label="From Date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div>
          <div><FormDatePicker label="To Date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} min={dateFrom || undefined} /></div>
          <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
            {generating ? <FileSpreadsheet className="animate-pulse" size={17} /> : <Download size={17} />}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </Card>

      <div className="mb-3 flex items-end justify-between gap-4">
        <div><h2 className="text-base font-semibold text-[#E7ECF6]">{definition.label} Records</h2><p className="mt-1 text-sm text-[#8B96AE]">{loading ? "Loading filtered records..." : `${records.length} record${records.length === 1 ? "" : "s"} found`}</p></div>
      </div>
      {error && <p role="alert" className="mb-3 text-sm font-medium text-rose-500">{error}</p>}
      {!loading && <Table columns={tableColumns} rows={records} emptyLabel="No records found for the selected report and date range." />}
    </div>
  );
}

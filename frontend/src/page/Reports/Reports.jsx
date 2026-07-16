import React, { useEffect, useState } from "react";
import { reportsApi } from "../../api/endpoints";
import Swal from 'sweetalert2';

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#8B96AE] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-[#141E33] border border-[#1E2A45] rounded-xl ${className}`}>{children}</div>;
}

function Badge({ children, tone = "neutral" }) {
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

function Table({ columns, rows }) {
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
                  No saved reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// UI label <-> backend report_type enum
const REPORT_TYPES = [
  { label: "Medicine Usage", value: "medicine_usage" },
  { label: "Medicine Stock", value: "medicine_stock" },
  { label: "Patients", value: "patients" },
  { label: "Suppliers", value: "suppliers" },
  { label: "Products", value: "products" },
];

function Reports() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState("");

  const loadSavedReports = async () => {
    setLoadingSaved(true);
    try {
      const { data } = await reportsApi.getAll();
      setSavedReports(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadSavedReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const { data } = await reportsApi.generate({
        report_type: reportType,
        date_range_start: dateFrom || undefined,
        date_range_end: dateTo || undefined,
      });
      setGenerated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // const handleSave = async () => {
  //   if (!generated) return;
  //   const title = prompt("Title for this saved report:", `${reportType.replace("_", " ")} snapshot`);
  //   if (!title) return;
  //   try {
  //     await reportsApi.save({
  //       title,
  //       report_type: reportType,
  //       date_range_start: dateFrom || undefined,
  //       date_range_end: dateTo || undefined,
  //       data_snapshot: generated.data,
  //     });
  //     await loadSavedReports();
  //     alert("Report saved.");
  //   } catch (err) {
  //     alert(err.message);
  //   }
  // };

  const handleSave = async () => {
  if (!generated) return;

  const result = await Swal.fire({
    title: "Save this report?",
    input: "text",
    inputLabel: "Title",
    inputValue: `${reportType.replace("_", " ")} snapshot`,
    inputPlaceholder: "Title for this saved report",
    inputValidator: (value) => {
      if (!value) return "Please enter a title";
    },
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Save",
    denyButtonText: `Don't save`,
    background: "#141E33",
    color: "#ffffff",
  });

  // Cancel (Esc / clicking outside) — do nothing
  if (result.isDismissed) return;

  // "Don't save" — acknowledge and stop
  if (result.isDenied) {
    Swal.fire({
      title: "Changes are not saved",
      icon: "info",
      background: "#141E33",
      color: "#ffffff",
    });
    return;
  }

  // "Save" — result.value holds whatever was typed in the input
  try {
    await reportsApi.save({
      title: result.value,
      report_type: reportType,
      date_range_start: dateFrom || undefined,
      date_range_end: dateTo || undefined,
      data_snapshot: generated.data,
    });
    await loadSavedReports();
    Swal.fire({
      title: "Saved!",
      icon: "success",
      background: "#141E33",
      color: "#ffffff",
    });
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.message,
      icon: "error",
      background: "#141E33",
      color: "#ffffff",
    });
  }
};

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Reports" subtitle="Generate and revisit saved report snapshots" />

      <Card className="p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-[#8B96AE] mb-1 block">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8B96AE] mb-1 block">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#8B96AE] mb-1 block">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && <p className="text-sm text-rose-400 mt-3">{error}</p>}

        {generated && (
          <div className="mt-4 pt-4 border-t border-[#1E2A45] flex items-center justify-between">
            <p className="text-sm text-[#8B96AE]">
              {Array.isArray(generated.data) ? generated.data.length : 0} row(s) returned for{" "}
              <Badge>{generated.report_type.replace("_", " ")}</Badge>
            </p>
            <button onClick={handleSave} className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Save this report
            </button>
          </div>
        )}
      </Card>

      <h3 className="text-sm font-semibold text-[#E7ECF6] mb-3">Saved Reports</h3>
      {loadingSaved ? (
        <p className="text-sm text-[#8B96AE]">Loading saved reports...</p>
      ) : (
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "report_type", label: "Type", render: (r) => <Badge>{r.report_type.replace("_", " ")}</Badge> },
            {
              key: "range",
              label: "Date Range",
              render: (r) =>
                r.date_range_start && r.date_range_end ? `${r.date_range_start} – ${r.date_range_end}` : "—",
            },
            { key: "generated_by_name", label: "Generated By" },
          ]}
          rows={savedReports}
        />
      )}
    </div>
  );
}

export default Reports;

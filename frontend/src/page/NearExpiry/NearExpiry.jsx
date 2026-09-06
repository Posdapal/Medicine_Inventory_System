import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { expiryApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup, Pagination } from "../../components/ui/Common";
import { downloadExcel, printTable } from "../../utils/ExportUtils";
import { useAuth } from "../../context/AuthContext";

const HEADERS = ["Product", "Batch No.", "Manufacture Date", "Expiry Date", "Days Remaining", "Available Qty"];

function NearExpiry() {
  const { can } = useAuth();
  const canExport = can("expiry", "export");
  const canPrint = can("expiry", "print");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await expiryApi.nearExpiry({ search, page, limit });
      setRows(data.items); setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTelegram = async () => {
    const confirmation = await Swal.fire({
      title: "Send Telegram Alert?",
      text: "This will immediately send the daily expiry summary and urgent batch alerts to the configured Telegram channel.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Alert",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#14b8a6",
      cancelButtonColor: "#475569",
      background: "#0f172a",
      color: "#f1f5f9",
    });

    if (!confirmation.isConfirmed) return;

    setSendingTelegram(true);
    try {
      const res = await expiryApi.triggerTelegramAlert();
      Swal.fire({
        title: "Telegram Alert Sent!",
        text: res.message || `Summary and urgent batches sent successfully.`,
        icon: "success",
        confirmButtonColor: "#14b8a6",
        background: "#0f172a",
        color: "#f1f5f9",
      });
    } catch (err) {
      Swal.fire({
        title: "Failed to Send Alert",
        text: err.response?.data?.message || err.message || "Failed to communicate with Telegram API.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: "#0f172a",
        color: "#f1f5f9",
      });
    } finally {
      setSendingTelegram(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadRows(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit]);
  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const tableRows = () =>
    rows.map((r) => [r.product, r.batch_number, r.manufacture_date || "—", r.expiry_date, r.days_remaining, r.available_quantity]);

  const handleExportExcel = () => downloadExcel("near-expiry.xlsx", "Near Expiry", HEADERS, tableRows(), (pagination.page - 1) * pagination.limit);
  const handleExportPdf = () => printTable("Near Expiry Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Near Expiry Report", HEADERS, tableRows());

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <PageHeader title="Near Expiry" subtitle="Expiry Management / Near Expiry" description="Track products approaching their expiry date." />
        <button
          type="button"
          onClick={handleSendTelegram}
          disabled={sendingTelegram}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingTelegram ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sendingTelegram ? "Sending Telegram..." : "Send Telegram Alert"}
        </button>
      </div>

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search near-expiry batches..."
        extra={(canExport||canPrint) ? <ExportGroup onExportExcel={canExport?handleExportExcel:undefined} onExportPdf={canExport?handleExportPdf:undefined} onPrint={canPrint?handlePrint:undefined} /> : null}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading near-expiry batches...</p>
      ) : (
        <><Table
          columns={[
            { key: "product", label: "Product" },
            { key: "batch_number", label: "Batch No." },
            { key: "manufacture_date", label: "Manufacture Date", render: (r) => r.manufacture_date || "—" },
            { key: "expiry_date", label: "Expiry Date" },
            { key: "days_remaining", label: "Days Remaining", render: (r) => <Badge tone="warn">{r.days_remaining} days</Badge> },
            { key: "available_quantity", label: "Available Qty" },
          ]}
          rows={rows}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} /></>
      )}
    </div>
  );
}

export default NearExpiry;

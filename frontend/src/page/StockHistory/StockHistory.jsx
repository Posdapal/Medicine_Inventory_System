// StockHistory.jsx — Stock Management > Stock History
// Reflects the STOCK_MOVEMENTS entity: movement_type, quantity_before,
// movement_quantity, quantity_after, tied to a product and batch.
import { useEffect, useState } from "react";
import { stockApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup, Pagination } from "../../components/ui/Common";
import { downloadExcel, printTable } from "../../utils/ExportUtils";
import { useAuth } from "../../context/AuthContext";

const HEADERS = ["Product", "Batch No.", "Movement Type", "Qty Before", "Movement Qty", "Qty After", "Date"];

function movementTone(type) {
  if (type === "stock_in" || type === "in") return "good";
  if (type === "stock_out" || type === "out") return "bad";
  return "info";
}

function StockHistory() {
  const { can } = useAuth();
  const canExport = can("stock_history", "export");
  const canPrint = can("stock_history", "print");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.history({ search, page, limit });
      setRows(data.items); setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadRows(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit]);
  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const tableRows = () =>
    rows.map((r) => [r.product, r.batch_number || "—", r.movement_type, r.quantity_before, r.movement_quantity, r.quantity_after, r.date]);

  const handleExportExcel = () => downloadExcel("stock-history.xlsx", "Stock History", HEADERS, tableRows(), (pagination.page - 1) * pagination.limit);
  const handleExportPdf = () => printTable("Stock History Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Stock History Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Stock History" subtitle="Stock Management / Stock History" description="Review inventory movement and transaction history." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock history..."
        extra={(canExport||canPrint) ? <ExportGroup onExportExcel={canExport?handleExportExcel:undefined} onExportPdf={canExport?handleExportPdf:undefined} onPrint={canPrint?handlePrint:undefined} /> : null}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock history...</p>
      ) : (
        <><Table
          columns={[
            { key: "product", label: "Product" },
            { key: "batch_number", label: "Batch No.", render: (r) => r.batch_number || "—" },
            { key: "movement_type", label: "Movement Type", render: (r) => <Badge tone={movementTone(r.movement_type)}>{r.movement_type}</Badge> },
            { key: "quantity_before", label: "Qty Before" },
            { key: "movement_quantity", label: "Movement Qty" },
            { key: "quantity_after", label: "Qty After" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} /></>
      )}
    </div>
  );
}

export default StockHistory;

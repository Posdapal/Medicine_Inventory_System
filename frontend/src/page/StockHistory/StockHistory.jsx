// StockHistory.jsx — Stock Management > Stock History
// Reflects the STOCK_MOVEMENTS entity: movement_type, quantity_before,
// movement_quantity, quantity_after, tied to a product and batch.
import { useEffect, useState } from "react";
import { stockApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup } from "../../components/ui/Common";
import { downloadCsv, printTable } from "../../utils/ExportUtils";

const HEADERS = ["Product", "Batch No.", "Movement Type", "Qty Before", "Movement Qty", "Qty After", "Date"];

function movementTone(type) {
  if (type === "stock_in" || type === "in") return "good";
  if (type === "stock_out" || type === "out") return "bad";
  return "info";
}

function StockHistory() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.history({ search });
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadRows(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const tableRows = () =>
    rows.map((r) => [r.product, r.batch_number || "—", r.movement_type, r.quantity_before, r.movement_quantity, r.quantity_after, r.date]);

  const handleExportExcel = () => downloadCsv("stock-history.csv", HEADERS, tableRows());
  const handleExportPdf = () => printTable("Stock History Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Stock History Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Stock History" subtitle="Stock Management / Stock History" description="Review inventory movement and transaction history." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock history..."
        extra={<ExportGroup onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} onPrint={handlePrint} />}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock history...</p>
      ) : (
        <Table
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
        />
      )}
    </div>
  );
}

export default StockHistory;

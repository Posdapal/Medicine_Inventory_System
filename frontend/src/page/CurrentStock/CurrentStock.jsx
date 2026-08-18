// CurrentStock.jsx — Stock Management > Current Stock
// Shows available_quantity aggregated across each product's PRODUCT_BATCHES,
// compared against minimum_stock.
import { useEffect, useState } from "react";
import { stockApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup } from "../../components/ui/Common";
import { downloadCsv, printTable } from "../../utils/ExportUtils";

const HEADERS = ["Product Code", "Product Name", "Category", "Unit", "Available Qty", "Min Stock", "Status"];

function stockTone(stock, minimum) {
  return stock <= minimum ? "bad" : stock <= minimum * 1.5 ? "warn" : "good";
}

function CurrentStock() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.current({ search });
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
    rows.map((r) => [
      r.product_code, r.product_name, r.category, r.unit, r.available_quantity, r.minimum_stock,
      r.available_quantity <= r.minimum_stock ? "Low Stock" : "In Stock",
    ]);

  const handleExportExcel = () => downloadCsv("current-stock.csv", HEADERS, tableRows());
  const handleExportPdf = () => printTable("Current Stock Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Current Stock Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Current Stock" subtitle="Stock Management / Current Stock" description="Monitor available inventory and stock levels." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search current stock..."
        extra={<ExportGroup onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} onPrint={handlePrint} />}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading current stock...</p>
      ) : (
        <Table
          columns={[
            { key: "product_code", label: "Code" },
            { key: "product_name", label: "Product Name" },
            { key: "category", label: "Category", render: (r) => <Badge>{r.category}</Badge> },
            { key: "unit", label: "Unit" },
            { key: "available_quantity", label: "Available Qty" },
            { key: "minimum_stock", label: "Min Stock" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge tone={stockTone(r.available_quantity, r.minimum_stock)}>
                  {r.available_quantity <= r.minimum_stock ? "Low Stock" : "In Stock"}
                </Badge>
              ),
            },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}

export default CurrentStock;

// CurrentStock.jsx — Stock Management > Current Stock
// Shows available_quantity aggregated across each product's PRODUCT_BATCHES,
// compared against minimum_stock.
import { useEffect, useState } from "react";
import { stockApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup, Pagination } from "../../components/ui/Common";
import { downloadExcel, printTable } from "../../utils/ExportUtils";

const HEADERS = ["Product Code", "Product Name", "Category", "Unit", "Available Qty", "Min Stock", "Status"];

function stockTone(stock, minimum) {
  return stock <= minimum ? "bad" : stock <= minimum * 1.5 ? "warn" : "good";
}

function stockStatus(stock, minimum) {
  if (Number(stock) === 0) return "Out of Stock";
  return Number(stock) <= Number(minimum) ? "Low Stock" : "In Stock";
}

function CurrentStock({ navigationFilters = {} }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.current({ search, page, limit, stock_status: navigationFilters.stock_status });
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
  }, [query, pagination.page, pagination.limit, navigationFilters.stock_status]);
  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const tableRows = () =>
    rows.map((r) => [
      r.product_code, r.product_name, r.category, r.unit, r.available_quantity, r.minimum_stock,
      stockStatus(r.available_quantity, r.minimum_stock),
    ]);

  const handleExportExcel = () => downloadExcel("current-stock.xlsx", "Current Stock", HEADERS, tableRows(), (pagination.page - 1) * pagination.limit);
  const handleExportPdf = () => printTable("Current Stock Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Current Stock Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Current Stock" subtitle="Stock Management / Current Stock" description={navigationFilters.stock_status ? `Showing ${navigationFilters.stock_status.replaceAll("_", " ")} products from the dashboard.` : "Monitor available inventory and stock levels."} />

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
        <><Table
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
                  {stockStatus(r.available_quantity, r.minimum_stock)}
                </Badge>
              ),
            },
          ]}
          rows={rows}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} /></>
      )}
    </div>
  );
}

export default CurrentStock;

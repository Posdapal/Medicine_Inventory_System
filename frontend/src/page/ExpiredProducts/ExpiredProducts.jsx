// ExpiredProducts.jsx — Expiry Management > Expired Products
// Reflects PRODUCT_BATCHES whose expiry_date has passed.
import { useEffect, useState } from "react";
import { expiryApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup, Pagination } from "../../components/ui/Common";
import { downloadExcel, printTable } from "../../utils/ExportUtils";
import { useAuth } from "../../context/AuthContext";

const HEADERS = ["Product", "Batch No.", "Manufacture Date", "Expiry Date", "Days Expired", "Available Qty"];

function ExpiredProducts() {
  const { can } = useAuth();
  const canExport = can("expiry", "export");
  const canPrint = can("expiry", "print");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await expiryApi.expired({ search, page, limit });
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
    rows.map((r) => [r.product, r.batch_number, r.manufacture_date || "—", r.expiry_date, r.days_expired, r.available_quantity]);

  const handleExportExcel = () => downloadExcel("expired-products.xlsx", "Expired Batches", HEADERS, tableRows(), (pagination.page - 1) * pagination.limit);
  const handleExportPdf = () => printTable("Expired Products Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Expired Products Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Expired Products" subtitle="Expiry Management / Expired Products" description="Review products that have passed their expiry date." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search expired batches..."
        extra={(canExport||canPrint) ? <ExportGroup onExportExcel={canExport?handleExportExcel:undefined} onExportPdf={canExport?handleExportPdf:undefined} onPrint={canPrint?handlePrint:undefined} /> : null}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading expired batches...</p>
      ) : (
        <><Table
          columns={[
            { key: "product", label: "Product" },
            { key: "batch_number", label: "Batch No." },
            { key: "manufacture_date", label: "Manufacture Date", render: (r) => r.manufacture_date || "—" },
            { key: "expiry_date", label: "Expiry Date" },
            { key: "days_expired", label: "Days Expired", render: (r) => <Badge tone="bad">{r.days_expired} days</Badge> },
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

export default ExpiredProducts;

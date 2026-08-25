// NearExpiry.jsx — Expiry Management > Near Expiry
// Reflects PRODUCT_BATCHES filtered by expiry_date: batch_number,
// manufacture_date, expiry_date, available_quantity.
import { useEffect, useState } from "react";
import { expiryApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup, Pagination } from "../../components/ui/Common";
import { downloadExcel, printTable } from "../../utils/ExportUtils";

const HEADERS = ["Product", "Batch No.", "Manufacture Date", "Expiry Date", "Days Remaining", "Available Qty"];

function NearExpiry() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <PageHeader title="Near Expiry" subtitle="Expiry Management / Near Expiry" description="Track products approaching their expiry date." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search near-expiry batches..."
        extra={<ExportGroup onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} onPrint={handlePrint} />}
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

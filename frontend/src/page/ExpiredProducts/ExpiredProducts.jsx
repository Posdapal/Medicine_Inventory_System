// ExpiredProducts.jsx — Expiry Management > Expired Products
// Reflects PRODUCT_BATCHES whose expiry_date has passed.
import { useEffect, useState } from "react";
import { expiryApi } from "../../api/endpoints";
import { PageHeader, Badge, Table, Toolbar, ExportGroup } from "../../components/ui/Common";
import { downloadCsv, printTable } from "../../utils/ExportUtils";

const HEADERS = ["Product", "Batch No.", "Manufacture Date", "Expiry Date", "Days Expired", "Available Qty"];

function ExpiredProducts() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await expiryApi.expired({ search });
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
    rows.map((r) => [r.product, r.batch_number, r.manufacture_date || "—", r.expiry_date, r.days_expired, r.available_quantity]);

  const handleExportExcel = () => downloadCsv("expired-products.csv", HEADERS, tableRows());
  const handleExportPdf = () => printTable("Expired Products Report", HEADERS, tableRows());
  const handlePrint = () => printTable("Expired Products Report", HEADERS, tableRows());

  return (
    <div>
      <PageHeader title="Expired Products" subtitle="Expiry Management / Expired Products" description="Review products that have passed their expiry date." />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search expired batches..."
        extra={<ExportGroup onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} onPrint={handlePrint} />}
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading expired batches...</p>
      ) : (
        <Table
          columns={[
            { key: "product", label: "Product" },
            { key: "batch_number", label: "Batch No." },
            { key: "manufacture_date", label: "Manufacture Date", render: (r) => r.manufacture_date || "—" },
            { key: "expiry_date", label: "Expiry Date" },
            { key: "days_expired", label: "Days Expired", render: (r) => <Badge tone="bad">{r.days_expired} days</Badge> },
            { key: "available_quantity", label: "Available Qty" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}

export default ExpiredProducts;

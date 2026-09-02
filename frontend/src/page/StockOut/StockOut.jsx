/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
// StockOut.jsx — Stock Management > Stock Out
// Creates a STOCK_TRANSACTION (transaction_type = "stock_out") that draws
// down an existing PRODUCT_BATCH's available_quantity, with a reason and
// reference_number.
import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { stockApi, productsApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormInput, FormSelect, FormDatePicker,
  ImportButton, ActionButton, Pagination,
} from "../../components/ui/Common";
import { downloadExcel, parseCsvFile } from "../../utils/ExportUtils";
import Swal from "sweetalert2";
import { toast } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";

const CSV_HEADERS = ["product", "batch_number", "quantity", "reason", "reference_number", "transaction_date"];
const REASONS = ["Sale", "Damaged", "Expired", "Internal Use", "Other"];

function StockOutForm({ onSubmit, onClose, products, submitting }) {
  const [form, setForm] = useState({
    product: "",
    batch_number: "",
    quantity: "",
    reason: "",
    reference_number: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, batch_number: form.batch_number.trim(), reference_number: form.reference_number.trim(), quantity: Number(form.quantity) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSelect label="Product" required placeholder="Select a product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
          {products.map((p) => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
      </FormSelect>
      <FormInput label="Batch Number" required type="text" minLength={2} maxLength={50} placeholder="e.g. BATCH-2026-001" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Quantity" required type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 5" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <FormSelect label="Reason" required placeholder="Select a reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FormSelect>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Reference No." type="text" maxLength={50} placeholder="e.g. SALE-2026-001" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
        <FormDatePicker label="Transaction Date" required value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Create Stock Out"}
        </button>
      </div>
    </form>
  );
}

function StockOut({ navigationFilters = {} }) {
  const { can } = useAuth();
  const canCreate = can("stock_out", "create");
  const canDelete = can("stock_out", "delete");
  const canImport = can("stock_out", "import");
  const canExport = can("stock_out", "export");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  useEffect(() => {
    async function loadLookups() {
      try {
        const { data } = await productsApi.getAll();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadLookups();
  }, []);

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.stockOut.getAll({ search, page, limit, date: navigationFilters.date });
      setRows(data.items);
      setPagination(data.pagination);
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
  }, [query, pagination.page, pagination.limit, navigationFilters.date]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAdd = async (form) => {
    setSubmitting(true);
    try {
      await stockApi.stockOut.create(form);
      setIsAddOpen(false);
      await loadRows(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
     const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this record!",
      background: "#0B1220",
      color: "#ffffff",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      showClass: {
        popup: `
          animate__animated
          animate__fadeInUp
          animate__faster
        `,
      },
      hideClass: {
        popup: `
          animate__animated
          animate__fadeOutDown
          animate__faster
        `,
      },
    });

    // Cancel or dismiss (clicking outside, Esc) both land here and just stop
    if (!result.isConfirmed) return;

    try {
      await stockApi.stockOut.remove(id);
      await loadRows(query || undefined);

    } catch {
    }
    // if (!confirm("Remove this stock-out record?")) return;
    // try {
    //   await stockApi.stockOut.remove(id);
    //   await loadRows(query || undefined);
    // } catch (err) {
    //   alert(err.message);
    // }
  };

  const handleExport = () => {
    downloadExcel(
      "stock-out.xlsx",
      "Stock Out",
      ["Product", "Batch No.", "Quantity", "Reason", "Reference No.", "Date"],
      rows.map((r) => [r.product, r.batch_number, r.quantity, r.reason, r.reference_number, r.transaction_date]),
      (pagination.page - 1) * pagination.limit
    );
  };

  const handleImport = async (file) => {
    try {
      const records = await parseCsvFile(file);
      setSubmitting(true);
      for (const r of records) {
        await stockApi.stockOut.create({
          product: r.product,
          batch_number: r.batch_number,
          quantity: Number(r.quantity || 0),
          reason: r.reason,
          reference_number: r.reference_number,
          transaction_date: r.transaction_date,
        }, { skipToast: true });
      }
      await loadRows(query || undefined);
      toast.success(`Imported ${records.length} stock-out record(s).`);
    } catch (err) {
      toast.error(err.message || "Failed to import stock-out records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock Out" subtitle="Stock Management / Stock Out" description={navigationFilters.date === "today" ? "Showing completed stock-out records from today." : "Record and review outgoing inventory."} onAdd={canCreate ? () => setIsAddOpen(true) : undefined} addLabel="Create Stock Out" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock-out records..."
        extra={
          <>
            {canImport && <ImportButton label="Import Stock Out" onImport={handleImport} />}
            {canExport && <ActionButton icon={Download} label="Export Stock Out" onClick={handleExport} />}
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock-out records...</p>
      ) : (
        <><Table
          columns={[
            { key: "product", label: "Product" },
            { key: "batch_number", label: "Batch No." },
            { key: "quantity", label: "Quantity", render: (r) => <Badge tone="bad">-{r.quantity}</Badge> },
            { key: "reason", label: "Reason", render: (r) => <Badge>{r.reason}</Badge> },
            { key: "reference_number", label: "Reference No.", render: (r) => r.reference_number || "—" },
            { key: "transaction_date", label: "Date" },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                canDelete ? <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Record">
                  <Trash2 size={15} />
                </button> : null
              ),
            },
          ]}
          rows={rows}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} /></>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Stock Out">
        <StockOutForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} products={products} submitting={submitting} />
      </Modal>
    </div>
  );
}

export default StockOut;

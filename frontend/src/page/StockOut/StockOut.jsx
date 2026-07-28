// StockOut.jsx — Stock Management > Stock Out
// Creates a STOCK_TRANSACTION (transaction_type = "stock_out") that draws
// down an existing PRODUCT_BATCH's available_quantity, with a reason and
// reference_number.
import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
// import { stockApi, productsApi } from "../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, inputClass,
  ImportButton, ActionButton,
} from "../../components/ui/Common";
import { downloadCsv, parseCsvFile } from "../../utils/ExportUtils";

const CSV_HEADERS = ["product", "batch_number", "quantity", "reason", "reference_number", "transaction_date"];
const REASONS = ["Sale", "Damaged", "Expired", "Internal Use", "Other"];

function StockOutForm({ onSubmit, onClose, products, submitting }) {
  const [form, setForm] = useState({
    product: products[0]?.product_name || "",
    batch_number: "",
    quantity: 0,
    reason: REASONS[0],
    reference_number: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, quantity: Number(form.quantity) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Product">
        <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className={inputClass}>
          {products.map((p) => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
        </select>
      </FormField>
      <FormField label="Batch Number">
        <input required type="text" placeholder="Batch to draw down" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className={inputClass} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Quantity">
          <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Reason">
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass}>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Reference No.">
          <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Transaction Date">
          <input required type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className={inputClass} />
        </FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Create Stock Out"}
        </button>
      </div>
    </form>
  );
}

function StockOut() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  const loadRows = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.stockOut.getAll({ search });
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

  const handleAdd = async (form) => {
    setSubmitting(true);
    try {
      await stockApi.stockOut.create(form);
      setIsAddOpen(false);
      await loadRows(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this stock-out record?")) return;
    try {
      await stockApi.stockOut.remove(id);
      await loadRows(query || undefined);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = () => {
    downloadCsv(
      "stock-out.csv",
      CSV_HEADERS,
      rows.map((r) => [r.product, r.batch_number, r.quantity, r.reason, r.reference_number, r.transaction_date])
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
        });
      }
      await loadRows(query || undefined);
      alert(`Imported ${records.length} stock-out record(s).`);
    } catch (err) {
      alert(err.message || "Failed to import stock-out records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock Out" subtitle="Stock Management / Stock Out" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock-out records..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="Create Stock Out"
        extra={
          <>
            <ImportButton label="Import Stock Out (Optional)" onImport={handleImport} />
            <ActionButton icon={Download} label="Export Stock Out" onClick={handleExport} />
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock-out records...</p>
      ) : (
        <Table
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
                <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Record">
                  <Trash2 size={15} />
                </button>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Stock Out">
        <StockOutForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} products={products} submitting={submitting} />
      </Modal>
    </div>
  );
}

export default StockOut;

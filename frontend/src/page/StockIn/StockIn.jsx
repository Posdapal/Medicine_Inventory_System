// StockIn.jsx — Stock Management > Stock In
// Creates a STOCK_TRANSACTION (transaction_type = "stock_in") that receives
// a new PRODUCT_BATCH: batch_number, manufacture_date, expiry_date,
// received_quantity, purchase_price, tied to a supplier and reference_number.
import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { stockApi, productsApi, suppliersApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, inputClass,
  ImportButton, ActionButton,
} from "../../components/ui/Common";
import { downloadCsv, parseCsvFile } from "../../utils/ExportUtils";
import Swal from 'sweetalert2';

const CSV_HEADERS = [
  "product", "supplier", "batch_number", "manufacture_date", "expiry_date",
  "received_quantity", "purchase_price", "reference_number", "transaction_date",
];

function StockInForm({ onSubmit, onClose, products, suppliers, submitting }) {
  const [form, setForm] = useState({
    product: products[0]?.product_name || "",
    supplier: "",
    batch_number: "",
    manufacture_date: "",
    expiry_date: "",
    received_quantity: 0,
    purchase_price: 0,
    reference_number: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, received_quantity: Number(form.received_quantity), purchase_price: Number(form.purchase_price) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Product">
          <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className={inputClass}>
            {products.map((p) => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
          </select>
        </FormField>
        <FormField label="Supplier">
          <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={inputClass}>
            <option value="">No supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Batch Number">
          <input required type="text" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Reference No.">
          <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} className={inputClass} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Manufacture Date">
          <input type="date" value={form.manufacture_date} onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Expiry Date">
          <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={inputClass} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Received Quantity">
          <input required type="number" min="1" value={form.received_quantity} onChange={(e) => setForm({ ...form, received_quantity: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Purchase Price ($)">
          <input required type="number" step="0.01" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className={inputClass} />
        </FormField>
      </div>
      <FormField label="Transaction Date">
        <input required type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className={inputClass} />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Create Stock In"}
        </button>
      </div>
    </form>
  );
}

function StockIn() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [prodRes, supRes] = await Promise.all([productsApi.getAll(), suppliersApi.getAll()]);
        setProducts(prodRes.data);
        setSuppliers(supRes.data);
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
      const { data } = await stockApi.stockIn.getAll({ search });
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
      await stockApi.stockIn.create(form);
      setIsAddOpen(false);
      await loadRows(query || undefined);
    } catch (err) {
      alert(err.message);
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
      await stockApi.remove(id);
      await loadRows(query || undefined);

      Swal.fire("Deleted!", "StockIn has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the stockin.", "error");
    }
    // if (!confirm("Remove this stock-in record?")) return;
    // try {
    //   await stockApi.stockIn.remove(id);
    //   await loadRows(query || undefined);
    // } catch (err) {
    //   alert(err.message);
    // }
  };

  const handleExport = () => {
    downloadCsv(
      "stock-in.csv",
      CSV_HEADERS,
      rows.map((r) => [r.product, r.supplier, r.batch_number, r.manufacture_date, r.expiry_date, r.received_quantity, r.purchase_price, r.reference_number, r.transaction_date])
    );
  };

  const handleImport = async (file) => {
    try {
      const records = await parseCsvFile(file);
      setSubmitting(true);
      for (const r of records) {
        await stockApi.stockIn.create({
          product: r.product,
          supplier: r.supplier,
          batch_number: r.batch_number,
          manufacture_date: r.manufacture_date,
          expiry_date: r.expiry_date,
          received_quantity: Number(r.received_quantity || 0),
          purchase_price: Number(r.purchase_price || 0),
          reference_number: r.reference_number,
          transaction_date: r.transaction_date,
        });
      }
      await loadRows(query || undefined);
      alert(`Imported ${records.length} stock-in record(s).`);
    } catch (err) {
      alert(err.message || "Failed to import stock-in records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock In" subtitle="Stock Management / Stock In" description="Record and review incoming inventory." onAdd={() => setIsAddOpen(true)} addLabel="Create Stock In" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock-in records..."
        extra={
          <>
            <ImportButton label="Import Stock In" onImport={handleImport} />
            <ActionButton icon={Download} label="Export Stock In" onClick={handleExport} />
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock-in records...</p>
      ) : (
        <Table
          columns={[
            { key: "product", label: "Product" },
            { key: "supplier", label: "Supplier", render: (r) => r.supplier || "—" },
            { key: "batch_number", label: "Batch No." },
            { key: "expiry_date", label: "Expiry Date", render: (r) => r.expiry_date || "—" },
            { key: "received_quantity", label: "Qty Received", render: (r) => <Badge tone="good">+{r.received_quantity}</Badge> },
            { key: "purchase_price", label: "Purchase Price", render: (r) => `$${Number(r.purchase_price || 0).toFixed(2)}` },
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Stock In">
        <StockInForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} products={products} suppliers={suppliers} submitting={submitting} />
      </Modal>
    </div>
  );
}

export default StockIn;

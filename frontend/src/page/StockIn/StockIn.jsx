import { useEffect, useState } from "react";
import { Trash2, Download, Pencil } from "lucide-react";
import { stockApi, productsApi, suppliersApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormInput, FormSelect, FormDatePicker,
  ImportButton, ActionButton, Pagination,
} from "../../components/ui/Common";
import { downloadExcel, parseCsvFile, downloadXlsx, downloadXlsxTemplate, parseImportFile } from "../../utils/ExportUtils";
import Swal from 'sweetalert2';
import { toast } from "../../utils/toast";

const CSV_HEADERS = [
  "Product", "Supplier", "Batch No.", "Manufacture Date", "Expiry Date",
  "Qty Received", "Purchase Price", "Reference No.", "Date",
];

function StockInForm({ onSubmit, onClose, products, suppliers, submitting, initialValues, submitLabel }) {
  const [form, setForm] = useState(() => ({
    product: initialValues?.product || "",
    supplier: initialValues?.supplier || "",
    batch_number: initialValues?.batch_number || "",
    manufacture_date: initialValues?.manufacture_date || "",
    expiry_date: initialValues?.expiry_date || "",
    received_quantity: initialValues?.received_quantity ?? "",
    purchase_price: initialValues?.purchase_price ?? "",
    reference_number: initialValues?.reference_number || "",
    transaction_date: initialValues?.transaction_date || new Date().toISOString().slice(0, 10),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      batch_number: form.batch_number.trim(),
      reference_number: form.reference_number.trim(),
      received_quantity: Number(form.received_quantity),
      purchase_price: Number(form.purchase_price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="Product" required placeholder="Select a product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
          {products.map((p) => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
        </FormSelect>
        <FormSelect label="Supplier" placeholder="Select a supplier (optional)" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
          {suppliers.map((s) => <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>)}
        </FormSelect>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Batch Number" required type="text" minLength={2} maxLength={50} placeholder="e.g. BATCH-2026-001" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
        <FormInput label="Reference No." type="text" maxLength={50} placeholder="e.g. PO-2026-001" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormDatePicker label="Manufacture Date" value={form.manufacture_date} onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })} />
        <FormDatePicker label="Expiry Date" min={form.manufacture_date || undefined} value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Received Quantity" required type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 100" value={form.received_quantity} onChange={(e) => setForm({ ...form, received_quantity: e.target.value })} />
        <FormInput label="Purchase Price ($)" required type="number" step="0.01" min="0" inputMode="decimal" placeholder="e.g. 12.50" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
      </div>
      <FormDatePicker label="Transaction Date" required value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : (submitLabel || "Create Stock In")}
        </button>
      </div>
    </form>
  );
}

function StockIn({ navigationFilters = {} }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // null = add mode, object = edit mode
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

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

  const loadRows = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await stockApi.stockIn.getAll({ search, page, limit, date: navigationFilters.date });
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
      await stockApi.stockIn.create(form);
      setIsAddOpen(false);
      await loadRows(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      await stockApi.stockIn.update(editingRow.id, form);
      setEditingRow(null);
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
      showClass: { popup: `animate__animated animate__fadeInUp animate__faster` },
      hideClass: { popup: `animate__animated animate__fadeOutDown animate__faster` },
    });

    if (!result.isConfirmed) return;

    try {
      await stockApi.stockIn.remove(id);
      await loadRows(query || undefined);
    } catch {
    }
  };

  const handleExport = () => {
    downloadXlsx(
      "stock-in.xlsx",
      CSV_HEADERS,
      rows.map((r) => [r.product, r.supplier, r.batch_number, r.manufacture_date, r.expiry_date, r.received_quantity, Number(r.purchase_price || 0), r.reference_number, r.transaction_date]),
    );
  };

  const handleImport = async (file) => {
    try {
      const records = await parseImportFile(file);
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
        }, { skipToast: true });
      }
      await loadRows(query || undefined);
      toast.success(`Imported ${records.length} stock-in record(s).`);
    } catch (err) {
      toast.error(err.message || "Failed to import stock-in records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock In" subtitle="Stock Management / Stock In" description={navigationFilters.date === "today" ? "Showing completed stock-in records from today." : "Record and review incoming inventory."} onAdd={() => setIsAddOpen(true)} addLabel="Create Stock In" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search stock-in records..."
        extra={
          <>
            <ImportButton label="Import Stock In" onImport={handleImport} />
            <ActionButton icon={Download} label="Export Stock In" onClick={handleExport} />
            <ActionButton icon={Download} label="Download Template" onClick={() => downloadXlsxTemplate("stock-in.xlsx", CSV_HEADERS)} />
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading stock-in records...</p>
      ) : (
        <>
          <Table
            columns={[
              { key: "product", label: "Product" },
              { key: "supplier", label: "Supplier", render: (r) => r.supplier || "—" },
              { key: "batch_number", label: "Batch No." },
              { key: "manufacture_date", label: "Manufacture Date", render: (r) => r.manufacture_date || "-"},
              { key: "expiry_date", label: "Expiry Date", render: (r) => r.expiry_date || "—" },
              { key: "received_quantity", label: "Qty Received", render: (r) => <Badge tone="good">+{r.received_quantity}</Badge> },
              { key: "purchase_price", label: "Purchase Price", render: (r) => `$${Number(r.purchase_price || 0).toFixed(2)}` },
              { key: "reference_number", label: "Reference No.", render: (r) => r.reference_number || "—" },
              { key: "transaction_date", label: "Transition Date" },
              {
                key: "actions",
                label: "Actions",
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingRow(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Record">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Record">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            rowOffset={(pagination.page - 1) * pagination.limit}
          />
          <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} />
        </>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Stock In">
        <StockInForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} products={products} suppliers={suppliers} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingRow} onClose={() => setEditingRow(null)} title="Edit Stock In">
        {editingRow && (
          <StockInForm
            onSubmit={handleUpdate}
            onClose={() => setEditingRow(null)}
            products={products}
            suppliers={suppliers}
            submitting={submitting}
            submitLabel="Save Changes"
            initialValues={{
              product: editingRow.product,
              supplier: editingRow.supplier || "",
              batch_number: editingRow.batch_number,
              manufacture_date: editingRow.manufacture_date || "",
              expiry_date: editingRow.expiry_date || "",
              received_quantity: editingRow.received_quantity,
              purchase_price: editingRow.purchase_price,
              reference_number: editingRow.reference_number || "",
              transaction_date: editingRow.transaction_date,
            }}
          />
        )}
      </Modal>
    </div>
  );
}

export default StockIn;
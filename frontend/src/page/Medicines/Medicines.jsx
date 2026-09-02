/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react";
import { medicinesApi, categoriesApi, suppliersApi } from "../../api/endpoints";
import { FormSelect, Table } from "../../components/ui/Common";
import Swal from 'sweetalert2';

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#8B96AE] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Toolbar({ query, setQuery, placeholder, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="relative w-full max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50"
        />
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
        >
          <Plus size={15} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function stockTone(stock, reorder) {
  return stock <= reorder ? "bad" : stock <= reorder * 1.5 ? "warn" : "good";
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2A45]">
          <h3 className="text-lg font-medium text-[#E7ECF6]">{title}</h3>
          <button onClick={onClose} className="text-[#5D6B85] hover:text-[#E7ECF6] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function mapMedicineFromApi(m) {
  return {
    id: m.id,
    name: m.name,
    category: m.category_name,
    category_id: m.category_id,
    supplier: m.supplier_name || "",
    supplier_id: m.supplier_id,
    stock: m.stock_quantity,
    reorder: m.reorder_level,
    price: Number(m.price),
    expiry: m.expiry_date ? m.expiry_date.substring(0, 10) : "",
  };
}

// categories/suppliers are the real lookup lists fetched from the API,
// used to translate the selected name back into the id the backend expects.
function mapMedicineToApi(form, categories, suppliers) {
  const category = categories.find((c) => c.name === form.category);
  const supplier = suppliers.find((s) => s.name === form.supplier);
  return {
    name: form.name,
    category_id: category ? category.id : null,
    supplier_id: supplier ? supplier.id : null,
    price: form.price,
    stock_quantity: form.stock,
    reorder_level: form.reorder,
    expiry_date: form.expiry || null,
  };
}

function MedicineForm({ initialData, onSubmit, onClose, categories, suppliers, submitting }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      category: categories[0]?.name || "",
      supplier: "",
      stock: 0,
      reorder: 0,
      price: 0.0,
      expiry: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      stock: Number(formData.stock),
      reorder: Number(formData.reorder),
      price: Number(formData.price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Medicine Name <span className="text-rose-400" aria-hidden="true">*</span></label>
        <input
          required
          type="text"
          placeholder="e.g. Amoxicillin 500 mg"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
        </FormSelect>
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Price ($) <span className="text-rose-400" aria-hidden="true">*</span></label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 12.50"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
      </div>

      <FormSelect label="Supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}>
          <option value="">No supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
      </FormSelect>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Stock Level <span className="text-rose-400" aria-hidden="true">*</span></label>
          <input
            required
            type="number"
            min="0"
            placeholder="e.g. 100"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Reorder Point <span className="text-rose-400" aria-hidden="true">*</span></label>
          <input
            required
            type="number"
            min="0"
            placeholder="e.g. 20"
            value={formData.reorder}
            onChange={(e) => setFormData({ ...formData, reorder: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Expiry Date</label>
        <input
          type="date"
          value={formData.expiry}
          onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Medicines() {
  const [medicinesList, setMedicinesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Categories/suppliers rarely change while this page is open, so load them once
  useEffect(() => {
    async function loadLookups() {
      try {
        const [catRes, supRes] = await Promise.all([
          categoriesApi.getAll("medicine"),
          suppliersApi.getAll(),
        ]);
        setCategories(catRes.data);
        setSuppliers(supRes.data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadLookups();
  }, []);

  const loadMedicines = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await medicinesApi.getAll({ search });
      setMedicinesList(data.map(mapMedicineFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadMedicines(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAddMedicine = async (formData) => {
    setSubmitting(true);
    try {
      await medicinesApi.create(mapMedicineToApi(formData, categories, suppliers));
      setIsAddOpen(false);
      await loadMedicines(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMedicine = async (formData) => {
    setSubmitting(true);
    try {
      await medicinesApi.update(editingMedicine.id, mapMedicineToApi(formData, categories, suppliers));
      setEditingMedicine(null);
      await loadMedicines(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

   const handleDeleteMedicine = async (id) => {
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
        await medicinesApi.remove(id);
        await loadPatients(query || undefined);
  
      } catch {
      }
    };

  return (
    <div className="space-y-6">
      <PageHeader title="Medicines" subtitle="Stock levels and pricing" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search medicines..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add Medicine"
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading medicines...</p>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category", render: (r) => <Badge>{r.category}</Badge> },
            { key: "supplier", label: "Supplier", render: (r) => r.supplier || "—" },
            { key: "stock", label: "Stock", render: (r) => <Badge tone={stockTone(r.stock, r.reorder)}>{r.stock} units</Badge> },
            { key: "price", label: "Price", render: (r) => `$${r.price.toFixed(2)}` },
            { key: "expiry", label: "Expiry", render: (r) => r.expiry || "—" },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingMedicine(r)} className="text-[#5D6B85] hover:text-teal-400 transition-colors" title="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDeleteMedicine(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={medicinesList}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Medicine">
        <MedicineForm
          onSubmit={handleAddMedicine}
          onClose={() => setIsAddOpen(false)}
          categories={categories}
          suppliers={suppliers}
          submitting={submitting}
        />
      </Modal>

      <Modal isOpen={!!editingMedicine} onClose={() => setEditingMedicine(null)} title="Update Medicine Stock Details">
        {editingMedicine && (
          <MedicineForm
            initialData={editingMedicine}
            onSubmit={handleEditMedicine}
            onClose={() => setEditingMedicine(null)}
            categories={categories}
            suppliers={suppliers}
            submitting={submitting}
          />
        )}
      </Modal>
    </div>
  );
}

export default Medicines;

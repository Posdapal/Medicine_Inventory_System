/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2, Save } from "lucide-react";
import { suppliersApi } from "../../api/endpoints";
import Swal from 'sweetalert2';
import { PageHeader, FormInput, FormSelect, Pagination, Table } from "../../components/ui/Common";
import { useAuth } from "../../context/AuthContext";

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

// Wider card-style modal — mirrors the "Create Supplier" page template:
// title + subtitle header, divider, body, divider, footer with actions.
function FormModal({ isOpen, onClose, title, subtitle, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#0F1626] border border-[#1E2A45] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#1E2A45]">
          <div>
            <h3 className="text-xl font-semibold text-[#E7ECF6]">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-[#8B96AE]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#5D6B85] hover:text-[#E7ECF6] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#1E2A45] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

function mapSupplierFromApi(s) {
  return {
    id: s.id,
    code: s.supplier_code,
    name: s.supplier_name,
    contact: s.contact_name || "",
    phone: s.phone || "",
    email: s.email || "",
    address: s.address || "",
    status: s.status,
  };
}

function mapSupplierToApi(form) {
  return {
    supplier_code: form.code.trim(),
    supplier_name: form.name.trim(),
    contact_name: form.contact.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim().toLowerCase() || null,
    address: form.address.trim() || null,
    status: form.status,
  };
}

// function SupplierForm({ initialData, onSubmit, onClose, submitting }) {
//   const [formData, setFormData] = useState(
//     initialData || { code: "", name: "", contact: "", phone: "", email: "", address: "", status: "" }
//   );
// }

function SupplierForm({ initialData, onSubmit, formId }) {
  const [formData, setFormData] = useState(
    initialData || { code: "", name: "", contact: "", phone: "", email: "", address: "", status: "active" }
  );
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Re-validate live once the user has already tried submitting or touched this field
    if (touched[field] || errors[field]) {
      const nextErrors = validateSupplierForm({ ...formData, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const nextErrors = validateSupplierForm(formData);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      code: formData.code.trim(),
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    });
  };

  const inputClass = (field) =>
    `w-full bg-[#070B12] border rounded-lg px-3 py-2.5 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 ${errors[field]
      ? "border-rose-500/60 focus:ring-rose-500/40"
      : "border-[#1E2A45] focus:ring-teal-500/40"
    }`;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="Supplier Code" required type="text" minLength={2} maxLength={30} pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, hyphens, or underscores only." placeholder="e.g. SUP-1001" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
      <FormInput label="Supplier Name" required type="text" minLength={2} maxLength={100} placeholder="e.g. MedSupply Co." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

      <FormInput label="Contact Person" type="text" maxLength={100} placeholder="e.g. Jane Smith" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />

      <FormInput label="Phone Number" type="tel" inputMode="tel" maxLength={30} pattern="[+0-9() .-]{7,30}" title="Enter a valid phone number using digits and common phone symbols." placeholder="e.g. +66 81 234 5678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />

      <FormInput label="Email Address" type="email" maxLength={120} placeholder="e.g. orders@medsupply.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

      <FormInput label="Address" type="text" maxLength={255} placeholder="e.g. 123 Health Street, Bangkok" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />

      <FormSelect label="Status" required placeholder="Select a status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
      </FormSelect>

    </form>
  );
}

function Suppliers({ navigationFilters = {} }) {
  const { can } = useAuth();
  const canCreate = can("suppliers", "create");
  const canUpdate = can("suppliers", "update");
  const canDelete = can("suppliers", "delete");
  const [suppliersList, setSuppliersList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadSuppliers = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await suppliersApi.getAll({ search, page, limit, status: navigationFilters.status });
      setSuppliersList(data.items.map(mapSupplierFromApi));
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadSuppliers(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit, navigationFilters.status]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAddSupplier = async (formData) => {
    setSubmitting(true);
    try {
      await suppliersApi.create(mapSupplierToApi(formData));
      setIsAddOpen(false);
      await loadSuppliers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSupplier = async (formData) => {
    setSubmitting(true);
    try {
      await suppliersApi.update(editingSupplier.id, mapSupplierToApi(formData));
      setEditingSupplier(null);
      await loadSuppliers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
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
      await suppliersApi.remove(id);
      await loadSuppliers(query || undefined);

    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" subtitle="Suppliers / Supplier List" description="Manage vendor contacts and supplier status." onAdd={canCreate ? () => setIsAddOpen(true) : undefined} addLabel="Add Supplier" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search suppliers..."
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading suppliers...</p>
      ) : (
        <>
        <Table
          columns={[
            { key: "code", label: "Supplier Code" },
            { key: "name", label: "Supplier Name" },
            { key: "contact", label: "Contact Person", render: (r) => r.contact || "—" },
            { key: "phone", label: "Phone Number" },
            { key: "email", label: "Email" },
            { key: "address", label: "Address" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "bad"}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  {canUpdate && <button onClick={() => setEditingSupplier(r)} className="text-[#5D6B85] hover:text-teal-400 transition-colors" title="Edit Supplier">
                    <Edit2 size={15} />
                  </button>}
                  {canDelete && <button onClick={() => handleDeleteSupplier(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Supplier">
                    <Trash2 size={15} />
                  </button>}
                </div>
              ),
            },
          ]}
          rows={suppliersList}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} />
        </>
      )}

      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Supplier"
        subtitle="Fill in the information below to add a new supplier."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-supplier-form"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 text-sm font-semibold rounded-lg transition-colors"
            >
              <Save size={15} /> {submitting ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <SupplierForm
          formId="add-supplier-form"
          onSubmit={handleAddSupplier}
          onClose={() => setIsAddOpen(false)}
          submitting={submitting}
        />
      </FormModal>

      <FormModal
        isOpen={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        title="Update Supplier"
        subtitle="Update the information below and save your changes."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingSupplier(null)}
              className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-supplier-form"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 text-sm font-semibold rounded-lg transition-colors"
            >
              <Save size={15} /> {submitting ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {editingSupplier && (
          <SupplierForm
            formId="edit-supplier-form"
            initialData={editingSupplier}
            onSubmit={handleEditSupplier}
            onClose={() => setEditingSupplier(null)}
            submitting={submitting}
          />
        )}
      </FormModal>
    </div>
  );
}

export default Suppliers;

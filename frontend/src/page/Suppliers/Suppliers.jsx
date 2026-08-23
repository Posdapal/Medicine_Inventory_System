import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2, Save } from "lucide-react";
import { suppliersApi } from "../../api/endpoints";
import Swal from 'sweetalert2';
import { PageHeader } from "../../components/ui/Common";

function Toolbar({ query, setQuery, placeholder, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="relative w-full max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
        />
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
        >
          <Plus size={15} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
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
    code: s.supplier_code || "",
    name: s.supplier_name || "",
    contact: s.contact_name || "",
    phone: s.phone || "",
    email: s.email || "",
    address: s.address || "",
    status: s.status,
  };
}

function mapSupplierToApi(form) {
  return {
    supplier_code: form.code,
    supplier_name: form.name,
    contact_name: form.contact || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    status: form.status,
  };
}

// Basic phone validation: digits, spaces, +, -, (), 7-20 chars
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

function validateSupplierForm(formData) {
  const errors = {};

  const code = (formData.code || "").trim();
  if (!code) {
    errors.code = "Supplier code is required.";
  }

  const name = (formData.name || "").trim();
  if (!name) {
    errors.name = "Supplier name is required.";
  } else if (name.length < 2) {
    errors.name = "Supplier name must be at least 2 characters.";
  }

  const contact = (formData.contact || "").trim();
  if (!contact) {
    errors.contact = "Contact person is required.";
  } else if (contact.length < 2) {
    errors.contact = "Contact person must be at least 2 characters.";
  }

  const email = (formData.email || "").trim();
  if (!email) {
    errors.email = "Email person is required.";
  } else if (email.length < 2) {
    errors.email = "Email person must be at least 2 characters.";
  }

  const address = (formData.address || "").trim();
  if (!address) {
    errors.address = "Address person is required.";
  } else if (address.length < 2) {
    errors.address = "Address person must be at least 2 characters.";
  }

  const phone = (formData.phone || "").trim();
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-400">{message}</p>;
}

// Label styled to match the reference template: bold text + red required asterisk.
function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-[#E7ECF6] mb-1.5">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function SupplierForm({ initialData, onSubmit, onClose, submitting, formId }) {
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
    const nextErrors = validateSupplierForm(formData);
    setErrors(nextErrors);
    setTouched({ code: true, name: true, contact: true, phone: true, email: true, address: true });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(formData);
  };

  const inputClass = (field) =>
    `w-full bg-[#070B12] border rounded-lg px-3 py-2.5 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 ${errors[field]
      ? "border-rose-500/60 focus:ring-rose-500/40"
      : "border-[#1E2A45] focus:ring-blue-500/40"
    }`;

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <FieldLabel required>Supplier Code</FieldLabel>
          <input
            type="text"
            value={formData.code}
            onChange={handleChange("code")}
            onBlur={handleBlur("code")}
            className={inputClass("code")}
            aria-invalid={!!errors.code}
          />
          <FieldError message={errors.code} />
        </div>

        <div>
          <FieldLabel required>Supplier Name</FieldLabel>
          <input
            type="text"
            value={formData.name}
            onChange={handleChange("name")}
            onBlur={handleBlur("name")}
            className={inputClass("name")}
            aria-invalid={!!errors.name}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <FieldLabel required>Contact Person</FieldLabel>
          <input
            type="text"
            value={formData.contact}
            onChange={handleChange("contact")}
            onBlur={handleBlur("contact")}
            className={inputClass("contact")}
            aria-invalid={!!errors.contact}
          />
          <FieldError message={errors.contact} />
        </div>

        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <input
            type="text"
            value={formData.phone}
            onChange={handleChange("phone")}
            onBlur={handleBlur("phone")}
            className={inputClass("phone")}
            aria-invalid={!!errors.phone}
          />
          <FieldError message={errors.phone} />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            type="text"
            value={formData.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            className={inputClass("email")}
            aria-invalid={!!errors.email}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <FieldLabel required>Status</FieldLabel>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2.5 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <FieldLabel required>Address</FieldLabel>
          <textarea
            rows={3}
            value={formData.address}
            onChange={handleChange("address")}
            onBlur={handleBlur("address")}
            className={`${inputClass("address")} resize-y`}
            aria-invalid={!!errors.address}
          />
          <FieldError message={errors.address} />
        </div>
      </div>

      {!formId && (
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </form>
  );
}

function Suppliers() {
  const [suppliersList, setSuppliersList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const loadSuppliers = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await suppliersApi.getAll(search);
      setSuppliersList(data.map(mapSupplierFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadSuppliers(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAddSupplier = async (formData) => {
    setSubmitting(true);
    try {
      await suppliersApi.create(mapSupplierToApi(formData));
      setIsAddOpen(false);
      await loadSuppliers(query || undefined);
    } catch (err) {
      console.error("Create supplier failed:", err);
      alert(err.response?.data?.message || err.message || "Failed to create supplier.");
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
    } catch (err) {
      console.error("Update supplier failed:", err);
      alert(err.response?.data?.message || err.message || "Failed to update supplier.");
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

      Swal.fire("Deleted!", "Supplier has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the supplier.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" subtitle="Suppliers / Supplier List" description="Manage vendor contacts and supplier status." onAdd={() => setIsAddOpen(true)} addLabel="Add Supplier" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search suppliers..."
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading suppliers...</p>
      ) : (
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
                  <button onClick={() => setEditingSupplier(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Supplier">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDeleteSupplier(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Supplier">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={suppliersList}
        />
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
        title="Update Vendor Credentials"
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
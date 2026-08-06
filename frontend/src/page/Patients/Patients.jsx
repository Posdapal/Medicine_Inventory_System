import { useEffect, useState } from "react";
import {
  Search, Plus, Trash2, X, Edit2, AlertTriangle
} from "lucide-react";
import { patientsApi } from "../../api/endpoints";
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

// Maps the API's snake_case columns to the field names this page's UI uses
function mapPatientFromApi(p) {
  return {
    id: p.id,
    name: p.full_name,
    gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "",
    phone: p.phone || "",
    blood: p.blood_group || "",
    dob: p.date_of_birth ? p.date_of_birth.substring(0, 10) : "",
  };
}

function mapPatientToApi(form) {
  return {
    full_name: form.name,
    gender: form.gender ? form.gender.toLowerCase() : null,
    phone: form.phone || null,
    blood_group: form.blood || null,
    date_of_birth: form.dob || null,
  };
}

function PatientForm({ initialData, onSubmit, onClose, submitting }) {
  const [formData, setFormData] = useState(
    initialData || { name: "", gender: "Female", phone: "", blood: "O+", dob: "" }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Full Name</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Blood Group</label>
          <input
            type="text"
            placeholder="e.g. O+"
            value={formData.blood}
            onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Phone Number</label>
        <input
          required
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Date of Birth</label>
        <input
          required
          type="date"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, patientName, deleting }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#E7ECF6]">Delete patient record?</h3>
              <p className="text-sm text-[#8B96AE] mt-1.5">
                {patientName ? (
                  <>
                    You're about to permanently delete{" "}
                    <span className="text-[#D7DEEB] font-medium">{patientName}</span>'s record, including their
                    prescription history. This can't be undone.
                  </>
                ) : (
                  "This record will be permanently deleted. This can't be undone."
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] disabled:opacity-60 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {deleting ? "Deleting..." : "Delete Patient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Patients() {
  const [patientsList, setPatientsList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(true)


  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);


  const loadPatients = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await patientsApi.getAll(search);
      setPatientsList(data.map(mapPatientFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadPatients(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAddPatient = async (formData) => {
    setSubmitting(true);
    try {
      await patientsApi.create(mapPatientToApi(formData));
      setIsAddOpen(false);
      await loadPatients(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPatient = async (formData) => {
    setSubmitting(true);
    try {
      await patientsApi.update(editingPatient.id, mapPatientToApi(formData));
      setEditingPatient(null);
      await loadPatients(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this record!",
      icon: "warning",
      background: "#0B1220",
      color: "#ffffff",
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
      await patientsApi.remove(id);
      await loadPatients(query || undefined);

      Swal.fire("Deleted!", "Patient has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the patient.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" subtitle="Records and prescription history" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search patients..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add Patient"
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading patients...</p>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "gender", label: "Gender" },
            { key: "phone", label: "Phone" },
            { key: "blood", label: "Blood Group", render: (r) => <Badge tone="info">{r.blood || "—"}</Badge> },
            { key: "dob", label: "Date of Birth" },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingPatient(r)}
                    className="text-[#5D6B85] hover:text-blue-400 transition-colors"
                    title="Edit Patient"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeletePatient(r.id)}
                    className="text-[#5D6B85] hover:text-rose-400 transition-colors"
                    title="Delete Patient"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={patientsList}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Patient">
        <PatientForm onSubmit={handleAddPatient} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        title="Update Patient Details"
      >
        {editingPatient && (
          <PatientForm
            initialData={editingPatient}
            onSubmit={handleEditPatient}
            onClose={() => setEditingPatient(null)}
            submitting={submitting}
          />
        )}
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={handleDeletePatient}
        patientName={deletingPatient?.name}
        deleting={deleting}
      />
    </div>
  );
}

export default Patients;

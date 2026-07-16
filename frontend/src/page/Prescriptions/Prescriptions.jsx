import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react";
import { prescriptionsApi, patientsApi, medicinesApi } from "../../api/endpoints";
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

function statusTone(s) {
  return s === "dispensed" ? "good" : s === "pending" ? "warn" : "bad";
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

function mapPrescriptionFromApi(p) {
  return {
    id: p.id,
    patient: p.patient_name,
    date: p.prescription_date ? p.prescription_date.substring(0, 10) : "",
    diagnosis: p.diagnosis || "",
    status: p.status,
    items: p.item_count,
  };
}

// Create form: full patient / diagnosis / medicine line-items, mirrors POST /prescriptions
function CreatePrescriptionForm({ onSubmit, onClose, patients, medicines, submitting }) {
  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ medicine_id: "", quantity: 1, dosage: "" }]);

  const addItem = () => setItems([...items, { medicine_id: "", quantity: 1, dosage: "" }]);
  const removeItem = (index) => setItems(items.filter((_, idx) => idx !== index));

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter((it) => it.medicine_id);
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    if (validItems.length === 0) {
      alert("Add at least one medicine.");
      return;
    }
    onSubmit({
      patient_id: Number(patientId),
      diagnosis,
      notes,
      items: validItems.map((it) => ({
        medicine_id: Number(it.medicine_id),
        quantity: Number(it.quantity) || 1,
        dosage: it.dosage,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-xs text-[#8B96AE] mb-1 block">Patient</label>
          <select
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8B96AE] mb-1 block">Diagnosis</label>
          <input
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="e.g. Seasonal flu"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="text-xs text-[#8B96AE] mb-1 block">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs text-[#8B96AE]">Medicines</label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium">
          <Plus size={13} /> Add medicine
        </button>
      </div>

      <div className="space-y-2 mb-5 max-h-[220px] overflow-y-auto pr-1">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-center bg-[#0F1626] border border-[#1E2A45] rounded-lg p-2.5">
            <select
              value={it.medicine_id}
              onChange={(e) => handleItemChange(i, "medicine_id", e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#E7ECF6] focus:outline-none"
            >
              <option value="">Select medicine...</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={it.quantity}
              onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
              className="w-16 bg-[#141E33] border border-[#1E2A45] rounded-md px-2 py-1.5 text-sm text-[#E7ECF6] text-center focus:outline-none"
            />
            <input
              placeholder="Dosage"
              value={it.dosage}
              onChange={(e) => handleItemChange(i, "dosage", e.target.value)}
              className="w-32 bg-[#141E33] border border-[#1E2A45] rounded-md px-2 py-1.5 text-sm text-[#E7ECF6] focus:outline-none"
            />
            <button type="button" onClick={() => removeItem(i)} className="text-[#5D6B85] hover:text-rose-400">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-[#1E2A45] pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#8B96AE] hover:text-[#E7ECF6]">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white">
          {submitting ? "Saving..." : "Save Prescription"}
        </button>
      </div>
    </form>
  );
}

// Edit form: the API only exposes a status transition (PATCH /prescriptions/:id/status),
// so editing an existing prescription means moving it through pending -> dispensed/cancelled.
// Marking it dispensed triggers the backend's stock deduction + usage logging.
function StatusForm({ prescription, onSubmit, onClose, submitting }) {
  const [status, setStatus] = useState(prescription.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(status);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-[#8B96AE]">
        <p className="text-[#E7ECF6] font-medium">{prescription.patient}</p>
        <p>{prescription.diagnosis}</p>
        <p>{prescription.items} medicine(s) · {prescription.date}</p>
      </div>
      <div>
        <label className="text-xs text-[#8B96AE] mb-1 block">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="pending">Pending</option>
          <option value="dispensed">Dispensed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {status === "dispensed" && (
          <p className="text-xs text-amber-400 mt-2">
            Marking this dispensed will deduct stock for each medicine and log it in the usage report.
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-[#1E2A45] pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#8B96AE] hover:text-[#E7ECF6]">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white">
          {submitting ? "Saving..." : "Update Status"}
        </button>
      </div>
    </form>
  );
}

function Prescriptions() {
  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [patientsRes, medicinesRes] = await Promise.all([
          patientsApi.getAll(),
          medicinesApi.getAll({}),
        ]);
        setPatients(patientsRes.data);
        setMedicines(medicinesRes.data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadLookups();
  }, []);

  const loadPrescriptions = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await prescriptionsApi.getAll({ search });
      setPrescriptionsList(data.map(mapPrescriptionFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadPrescriptions(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await prescriptionsApi.create(payload);
      setIsAddOpen(false);
      await loadPrescriptions(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    setSubmitting(true);
    try {
      await prescriptionsApi.updateStatus(editingPrescription.id, status);
      setEditingPrescription(null);
      await loadPrescriptions(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // const handleDelete = async (id) => {
  //   if (!confirm("Are you sure you want to delete this prescription?")) return;
  //   try {
  //     await prescriptionsApi.remove(id);
  //     await loadPrescriptions(query || undefined);
  //   } catch (err) {
  //     alert(err.message);
  //   }
  // };

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
      await prescriptionsApi.remove(id);
      await loadPatients(query || undefined);

      Swal.fire("Deleted!", "Supplier has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the supplier.", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Prescriptions" subtitle="Issue and dispense patient prescriptions" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search by patient..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="New Prescription"
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading prescriptions...</p>
      ) : (
        <Table
          columns={[
            { key: "patient", label: "Patient" },
            { key: "date", label: "Date" },
            { key: "diagnosis", label: "Diagnosis" },
            { key: "items", label: "Items", render: (r) => <Badge tone="info">{r.items} medicines</Badge> },
            { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingPrescription(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Update status">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={prescriptionsList}
        />
      )}

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0F1626] border border-[#1E2A45] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#E7ECF6]">New Prescription</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-[#8B96AE] hover:text-[#E7ECF6]">
                <X size={18} />
              </button>
            </div>
            <CreatePrescriptionForm
              onSubmit={handleCreate}
              onClose={() => setIsAddOpen(false)}
              patients={patients}
              medicines={medicines}
              submitting={submitting}
            />
          </div>
        </div>
      )}

      {editingPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#0F1626] border border-[#1E2A45] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#E7ECF6]">Update Prescription Status</h2>
              <button onClick={() => setEditingPrescription(null)} className="text-[#8B96AE] hover:text-[#E7ECF6]">
                <X size={18} />
              </button>
            </div>
            <StatusForm
              prescription={editingPrescription}
              onSubmit={handleStatusUpdate}
              onClose={() => setEditingPrescription(null)}
              submitting={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Prescriptions;

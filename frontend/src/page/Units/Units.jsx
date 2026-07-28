// Units.jsx — Products > Units
import React, { useEffect, useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
// import { unitsApi } from "../api/endpoints";
import { PageHeader, Table, Toolbar, Modal, FormField, inputClass } from "../../components/ui/Common";

function UnitForm({ initialData, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(initialData || { name: "", abbreviation: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Unit Name">
        <input required type="text" placeholder="e.g. Box, Bottle, Piece" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Abbreviation">
        <input type="text" placeholder="e.g. box, btl, pc" value={form.abbreviation}
          onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} className={inputClass} />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Save Unit"}
        </button>
      </div>
    </form>
  );
}

function Units() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const loadUnits = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await unitsApi.getAll(search);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadUnits(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAdd = async (form) => {
    setSubmitting(true);
    try {
      await unitsApi.create(form);
      setIsAddOpen(false);
      await loadUnits(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (form) => {
    setSubmitting(true);
    try {
      await unitsApi.update(editingUnit.id, form);
      setEditingUnit(null);
      await loadUnits(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      await unitsApi.remove(id);
      await loadUnits(query || undefined);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Units" subtitle="Products / Units" />

      <Toolbar query={query} setQuery={setQuery} placeholder="Search units..." onAdd={() => setIsAddOpen(true)} addLabel="Add Unit" />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading units...</p>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "abbreviation", label: "Abbreviation", render: (r) => r.abbreviation || "—" },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingUnit(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Unit">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Unit">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Unit">
        <UnitForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingUnit} onClose={() => setEditingUnit(null)} title="Update Unit">
        {editingUnit && <UnitForm initialData={editingUnit} onSubmit={handleEdit} onClose={() => setEditingUnit(null)} submitting={submitting} />}
      </Modal>
    </div>
  );
}

export default Units;

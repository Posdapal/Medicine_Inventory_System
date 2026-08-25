/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
// Units.jsx — Products > Units
import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, ChevronRight } from "lucide-react";
import { unitsApi } from "../../api/endpoints";
import { Table, Toolbar, Modal, FormInput, Pagination } from "../../components/ui/Common";
import Swal from 'sweetalert2';

function UnitForm({ initialData, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(initialData || { name: "", abbreviation: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, name: form.name.trim(), abbreviation: form.abbreviation.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="Unit Name" required type="text" minLength={2} maxLength={50} placeholder="e.g. Box, Bottle, Piece" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <FormInput label="Abbreviation" type="text" maxLength={10} pattern="[A-Za-z0-9.-]*" title="Use letters, numbers, periods, or hyphens only." placeholder="e.g. box, btl, pc" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} />
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadUnits = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await unitsApi.getAll({ search, page, limit });
      setRows(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadUnits(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAdd = async (form) => {
    setSubmitting(true);
    try {
      await unitsApi.create(form);
      setIsAddOpen(false);
      await loadUnits(query || undefined);
    } catch {
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
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
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
      await unitsApi.remove(id);
      await loadUnits(query || undefined);

    } catch {
    }
    // if (!confirm("Are you sure you want to delete this unit?")) return;
    // try {
    //   await unitsApi.remove(id);
    //   await loadUnits(query || undefined);
    // } catch (err) {
    //   alert(err.message);
    // }
  };

  return (
    <div className="w-full">
      <section className="w-full overflow-hidden rounded-2xl border border-[#1E2A45] bg-[#111A2C]/90 shadow-xl shadow-black/10">
        <header className="border-b border-[#1E2A45] px-5 py-5 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#7D8AA3]">
            <span>Products</span>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="text-teal-400">Units</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#E7ECF6]">Units</h1>
              <p className="mt-1 text-sm text-[#8B96AE]">Manage the measurement units used across your inventory.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-teal-950/30 transition-colors hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-[#111A2C]"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Unit
            </button>
          </div>
        </header>

        <div className="px-5 py-5 sm:px-6">
          <Toolbar query={query} setQuery={setQuery} placeholder="Search units..." />

          {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
          <div className="overflow-hidden rounded-xl border border-[#1E2A45] bg-[#0F1626]">
            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-[#8B96AE]">Loading units...</p>
            ) : (
              <>
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
                rowOffset={(pagination.page - 1) * pagination.limit}
              />
              <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} />
              </>
            )}
          </div>
        </div>
      </section>

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

/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
// Categories.jsx — Products > Categories
// Fields follow the CATEGORIES entity in the ERD: name, description, status.
import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Download } from "lucide-react";
import { categoriesApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormInput, FormSelect,
  ImportButton, ActionButton, Pagination,
} from "../../components/ui/Common";
import { downloadExcel, downloadTemplate, parseCsvFile } from "../../utils/ExportUtils";
import Swal from "sweetalert2";
import { toast } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";

const CSV_HEADERS = ["name", "description", "status"];

function validateCategoryForm(form) {
  const errors = {};

  const name = (form.name || "").trim();
  if (!name) {
    errors.name = "Category name is required.";
  } else if (name.length < 2) {
    errors.name = "Category name must be at least 2 characers.";
  }

  const description = (form.description || "").trim();
  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length > 5) {
    errors.description = "Description must be 5 characters or fewer.";
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-400">{message}</p>;
}

function CategoryForm({ initialData, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(initialData || { name: "", description: "", status: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
  };

  const fieldClass = (field) =>
      `${inputClass} ${errors[field] ? "border-rose-500/60 focus:ring-rose-500/40" : ""}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="Category Name" required type="text" minLength={2} maxLength={100} placeholder="e.g. Antibiotics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <FormInput label="Description" type="text" maxLength={255} placeholder="Briefly describe this category" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <FormSelect label="Status" required placeholder="Select a status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
      </FormSelect>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Save Category"}
        </button>
      </div>
    </form>
  );
}

function Categories({ navigationFilters = {} }) {
  const { can } = useAuth();
  const canCreate = can("categories", "create");
  const canUpdate = can("categories", "update");
  const canDelete = can("categories", "delete");
  const canImport = can("categories", "import");
  const canExport = can("categories", "export");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadCategories = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await categoriesApi.getAll({ search, page, limit, status: navigationFilters.status });
      setRows(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadCategories(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit, navigationFilters.status]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAdd = async (formData) => {
    setSubmitting(true);
    try {
      await categoriesApi.create(formData);
      setIsAddOpen(false);
      await loadCategories(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (formData) => {
    setSubmitting(true);
    try {
      await categoriesApi.update(editingCategory.id, formData);
      setEditingCategory(null);
      await loadCategories(query || undefined);
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
        await categoriesApi.remove(id);
        await loadCategories(query || undefined);
  
      } catch {
      }
  };

  const handleExport = () => {
    downloadExcel("categories.xlsx", "Categories", ["Name", "Description", "Status"], rows.map((r) => [r.name, r.description, r.status]), (pagination.page - 1) * pagination.limit);
  };

  const handleImport = async (file) => {
    try {
      const records = await parseCsvFile(file);
      setSubmitting(true);
      for (const r of records) {
        await categoriesApi.create({ name: r.name, description: r.description, status: r.status || "active" }, { skipToast: true });
      }
      await loadCategories(query || undefined);
      toast.success(`Imported ${records.length} categor${records.length === 1 ? "y" : "ies"}.`);
    } catch (err) {
      toast.error(err.message || "Failed to import categories.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Products / Categories" description="Organize products into clear inventory categories." onAdd={canCreate ? () => setIsAddOpen(true) : undefined} addLabel="Add Category" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search categories..."
        extra={
          <>
            {canImport && <ImportButton label="Import Categories" onImport={handleImport} />}
            {canExport && <ActionButton icon={Download} label="Export Categories" onClick={handleExport} />}
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading categories...</p>
      ) : (
        <>
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "description", label: "Description", render: (r) => r.description || "—" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "bad"}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  {canUpdate && <button onClick={() => setEditingCategory(r)} className="text-[#5D6B85] hover:text-teal-400 transition-colors" title="Edit Category">
                    <Edit2 size={15} />
                  </button>}
                  {canDelete && <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Category">
                    <Trash2 size={15} />
                  </button>}
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Category">
        <CategoryForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Update Category">
        {editingCategory && <CategoryForm initialData={editingCategory} onSubmit={handleEdit} onClose={() => setEditingCategory(null)} submitting={submitting} />}
      </Modal>
    </div>
  );
}

export default Categories;

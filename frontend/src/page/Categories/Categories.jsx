// import React from "react";
// import { useState, useEffect } from "react";
// import { categoriesApi } from "../../api/endpoints";

// function PageHeader({ title, subtitle, action }) {
//   return (
//     <div className="flex items-start justify-between mb-6">
//       <div>
//         <h1 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">{title}</h1>
//         {subtitle && <p className="text-sm text-[#8B96AE] mt-1">{subtitle}</p>}
//       </div>
//       {action}
//     </div>
//   );
// }

// function Badge({ children, tone = "neutral" }) {
//   const tones = {
//     neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
//     good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
//     warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
//     bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
//     info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
//   };
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
//       {children}
//     </span>
//   );
// }

// function Table({ columns, rows }) {
//   return (
//     <div className="overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
//               {columns.map((c) => (
//                 <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row, i) => (
//               <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
//                 {columns.map((c) => (
//                   <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
//                 ))}
//               </tr>
//             ))}
//             {rows.length === 0 && (
//               <tr>
//                 <td colSpan={columns.length} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
//                   No records match your search.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function Categories() {
//   const [tab, setTab] = useState("medicine");
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let isMounted = true;
//     async function loadCategories() {
//       setLoading(true);
//       setError("");
//       try {
//         const { data } = await categoriesApi.getAll(tab);
//         if (isMounted) setRows(data.map((c) => ({ ...c, count: c.item_count })));
//       } catch (err) {
//         if (isMounted) setError(err.message);
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     }
//     loadCategories();
//     return () => {
//       isMounted = false;
//     };
//   }, [tab]);

//   return (
//     <div className="p-6 space-y-6">
//       <PageHeader title="Categories" subtitle="Shared lookup for medicines and products" />
//       <div className="flex gap-2 mb-4">
//         {["medicine", "product"].map((t) => (
//           <button
//             key={t}
//             onClick={() => setTab(t)}
//             className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
//               tab === t ? "bg-blue-600 border-blue-600 text-white" : "bg-[#0F1626] border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6]"
//             }`}
//           >
//             {t === "medicine" ? "Medicine Categories" : "Product Categories"}
//           </button>
//         ))}
//       </div>
//       {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
//       {loading ? (
//         <p className="text-sm text-[#8B96AE]">Loading categories...</p>
//       ) : (
//         <Table
//           columns={[
//             { key: "name", label: "Name" },
//             { key: "count", label: "Items", render: (r) => <Badge tone="info">{r.count}</Badge> },
//           ]}
//           rows={rows}
//         />
//       )}
//     </div>
//   );
// }

// export default Categories;


// Categories.jsx — Products > Categories
// Fields follow the CATEGORIES entity in the ERD: name, description, status.
import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Download } from "lucide-react";
// import { categoriesApi } from "../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, inputClass,
  ImportButton, ActionButton,
} from "../../components/ui/Common";
import { downloadCsv, downloadTemplate, parseCsvFile } from "../../utils/ExportUtils";

const CSV_HEADERS = ["name", "description", "status"];

function CategoryForm({ initialData, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(initialData || { name: "", description: "", status: "active" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Category Name">
        <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Description">
        <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Status">
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Save Category"}
        </button>
      </div>
    </form>
  );
}

function Categories() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const loadCategories = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await categoriesApi.getAll(search);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadCategories(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAdd = async (formData) => {
    setSubmitting(true);
    try {
      await categoriesApi.create(formData);
      setIsAddOpen(false);
      await loadCategories(query || undefined);
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await categoriesApi.remove(id);
      await loadCategories(query || undefined);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = () => {
    downloadCsv("categories.csv", CSV_HEADERS, rows.map((r) => [r.name, r.description, r.status]));
  };

  const handleImport = async (file) => {
    try {
      const records = await parseCsvFile(file);
      setSubmitting(true);
      for (const r of records) {
        await categoriesApi.create({ name: r.name, description: r.description, status: r.status || "active" });
      }
      await loadCategories(query || undefined);
      alert(`Imported ${records.length} categor${records.length === 1 ? "y" : "ies"}.`);
    } catch (err) {
      alert(err.message || "Failed to import categories.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Products / Categories" description="Organize products into clear inventory categories." onAdd={() => setIsAddOpen(true)} addLabel="Add Category" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search categories..."
        extra={
          <>
            <ImportButton label="Import Categories" onImport={handleImport} />
            <ActionButton icon={Download} label="Export Categories" onClick={handleExport} />
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading categories...</p>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "description", label: "Description", render: (r) => r.description || "—" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingCategory(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Category">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Category">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
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

// import { useEffect, useState } from "react";
// import { Search, Plus, Trash2, X, Edit2 } from "lucide-react";
// import { productsApi, categoriesApi, suppliersApi } from "../../api/endpoints";
// import Swal from 'sweetalert2';

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

// function Toolbar({ query, setQuery, placeholder, onAdd, addLabel }) {
//   return (
//     <div className="flex items-center justify-between mb-4 gap-3">
//       <div className="relative w-full max-w-xs">
//         <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
//         <input
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder={placeholder}
//           className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
//         />
//       </div>
//       {onAdd && (
//         <button
//           onClick={onAdd}
//           className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
//         >
//           <Plus size={15} /> {addLabel}
//         </button>
//       )}
//     </div>
//   );
// }

// function stockTone(stock, reorder) {
//   return stock <= reorder ? "bad" : stock <= reorder * 1.5 ? "warn" : "good";
// }

// function Modal({ isOpen, onClose, title, children }) {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//       <div className="w-full max-w-md bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2A45]">
//           <h3 className="text-lg font-medium text-[#E7ECF6]">{title}</h3>
//           <button onClick={onClose} className="text-[#5D6B85] hover:text-[#E7ECF6] transition-colors">
//             <X size={18} />
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }

// function mapProductFromApi(p) {
//   return {
//     id: p.id,
//     name: p.name,
//     sku: p.sku || "",
//     category: p.category_name,
//     supplier: p.supplier_name || "",
//     stock: p.stock_quantity,
//     reorder: p.reorder_level,
//     price: Number(p.price),
//   };
// }

// function mapProductToApi(form, categories, suppliers) {
//   const category = categories.find((c) => c.name === form.category);
//   const supplier = suppliers.find((s) => s.name === form.supplier);
//   return {
//     name: form.name,
//     sku: form.sku || null,
//     category_id: category ? category.id : null,
//     supplier_id: supplier ? supplier.id : null,
//     price: form.price,
//     stock_quantity: form.stock,
//     reorder_level: form.reorder,
//   };
// }

// function ProductForm({ initialData, onSubmit, onClose, categories, suppliers, submitting }) {
//   const [formData, setFormData] = useState(
//     initialData || {
//       name: "",
//       sku: "",
//       category: categories[0]?.name || "",
//       supplier: "",
//       stock: 0,
//       reorder: 0,
//       price: 0.0,
//     }
//   );

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSubmit({
//       ...formData,
//       stock: Number(formData.stock),
//       reorder: Number(formData.reorder),
//       price: Number(formData.price),
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Product Name</label>
//         <input
//           required
//           type="text"
//           value={formData.name}
//           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//           className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//         />
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">SKU Code</label>
//           <input
//             type="text"
//             placeholder="e.g. EQ-1000"
//             value={formData.sku}
//             onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
//             className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//           />
//         </div>
//         <div>
//           <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Unit Price ($)</label>
//           <input
//             required
//             type="number"
//             step="0.01"
//             min="0"
//             value={formData.price}
//             onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//             className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Category</label>
//         <select
//           value={formData.category}
//           onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//           className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//         >
//           {categories.map((c) => (
//             <option key={c.id} value={c.name}>{c.name}</option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Supplier</label>
//         <select
//           value={formData.supplier}
//           onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
//           className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//         >
//           <option value="">No supplier</option>
//           {suppliers.map((s) => (
//             <option key={s.id} value={s.name}>{s.name}</option>
//           ))}
//         </select>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Stock Level</label>
//           <input
//             required
//             type="number"
//             min="0"
//             value={formData.stock}
//             onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
//             className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//           />
//         </div>
//         <div>
//           <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Reorder Point</label>
//           <input
//             required
//             type="number"
//             min="0"
//             value={formData.reorder}
//             onChange={(e) => setFormData({ ...formData, reorder: e.target.value })}
//             className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
//           />
//         </div>
//       </div>

//       <div className="flex justify-end gap-3 pt-2">
//         <button
//           type="button"
//           onClick={onClose}
//           className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           disabled={submitting}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
//         >
//           {submitting ? "Saving..." : "Save Product"}
//         </button>
//       </div>
//     </form>
//   );
// }

// function Products() {
//   const [productsList, setProductsList] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [query, setQuery] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   const [isAddOpen, setIsAddOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);

//   useEffect(() => {
//     async function loadLookups() {
//       try {
//         const [catRes, supRes] = await Promise.all([
//           categoriesApi.getAll("product"),
//           suppliersApi.getAll(),
//         ]);
//         setCategories(catRes.data);
//         setSuppliers(supRes.data);
//       } catch (err) {
//         setError(err.message);
//       }
//     }
//     loadLookups();
//   }, []);

//   const loadProducts = async (search) => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await productsApi.getAll({ search });
//       setProductsList(data.map(mapProductFromApi));
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const timeout = setTimeout(() => loadProducts(query || undefined), 300);
//     return () => clearTimeout(timeout);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [query]);

//   const handleAddProduct = async (formData) => {
//     setSubmitting(true);
//     try {
//       await productsApi.create(mapProductToApi(formData, categories, suppliers));
//       setIsAddOpen(false);
//       await loadProducts(query || undefined);
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleEditProduct = async (formData) => {
//     setSubmitting(true);
//     try {
//       await productsApi.update(editingProduct.id, mapProductToApi(formData, categories, suppliers));
//       setEditingProduct(null);
//       await loadProducts(query || undefined);
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // const handleDeleteProduct = async (id) => {
//   //   if (!confirm("Are you sure you want to delete this product record?")) return;
//   //   try {
//   //     await productsApi.remove(id);
//   //     await loadProducts(query || undefined);
//   //   } catch (err) {
//   //     alert(err.message);
//   //   }
//   // };

//   const handleDeleteProduct = async (id) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "You want to delete this record!",
//       background: "#0B1220",
//       color: "#ffffff",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#3085d6",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, delete it!",
//       showClass: {
//         popup: `
//           animate__animated
//           animate__fadeInUp
//           animate__faster
//         `,
//       },
//       hideClass: {
//         popup: `
//           animate__animated
//           animate__fadeOutDown
//           animate__faster
//         `,
//       },
//     });

//     // Cancel or dismiss (clicking outside, Esc) both land here and just stop
//     if (!result.isConfirmed) return;

//     try {
//       await productsApi.remove(id);
//       await loadPatients(query || undefined);

//       Swal.fire("Deleted!", "Supplier has been deleted.", "success");
//     } catch (err) {
//       Swal.fire("Error!", "An error occurred while deleting the supplier.", "error");
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <PageHeader title="Products" subtitle="Non-prescribable inventory" />

//       <Toolbar
//         query={query}
//         setQuery={setQuery}
//         placeholder="Search products..."
//         onAdd={() => setIsAddOpen(true)}
//         addLabel="Add Product"
//       />

//       {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
//       {loading ? (
//         <p className="text-sm text-[#8B96AE]">Loading products...</p>
//       ) : (
//         <Table
//           columns={[
//             { key: "name", label: "Name" },
//             { key: "sku", label: "SKU", render: (r) => r.sku || "—" },
//             { key: "category", label: "Category", render: (r) => <Badge>{r.category}</Badge> },
//             { key: "stock", label: "Stock", render: (r) => <Badge tone={stockTone(r.stock, r.reorder)}>{r.stock} units</Badge> },
//             { key: "price", label: "Price", render: (r) => `$${r.price.toFixed(2)}` },
//             {
//               key: "actions",
//               label: "Actions",
//               render: (r) => (
//                 <div className="flex items-center gap-3">
//                   <button onClick={() => setEditingProduct(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Product">
//                     <Edit2 size={15} />
//                   </button>
//                   <button onClick={() => handleDeleteProduct(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Product">
//                     <Trash2 size={15} />
//                   </button>
//                 </div>
//               ),
//             },
//           ]}
//           rows={productsList}
//         />
//       )}

//       <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Product">
//         <ProductForm
//           onSubmit={handleAddProduct}
//           onClose={() => setIsAddOpen(false)}
//           categories={categories}
//           suppliers={suppliers}
//           submitting={submitting}
//         />
//       </Modal>

//       <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Update Product Details">
//         {editingProduct && (
//           <ProductForm
//             initialData={editingProduct}
//             onSubmit={handleEditProduct}
//             onClose={() => setEditingProduct(null)}
//             categories={categories}
//             suppliers={suppliers}
//             submitting={submitting}
//           />
//         )}
//       </Modal>
//     </div>
//   );
// }

// export default Products;

// Products.jsx — "Product List" (Products > Product List)
// Fields follow the PRODUCTS entity in the ERD: product_code, product_name,
// generic_name, category_id, unit_id, minimum_stock, status.
// Available stock (available_quantity) is aggregated from PRODUCT_BATCHES
// and returned by the API alongside each product for display purposes.
import { useEffect, useState } from "react";
import { Trash2, Edit2, Download } from "lucide-react";
// import { productsApi, categoriesApi, unitsApi } from "../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, inputClass,
  ImportButton, ActionButton,
} from "../../components/ui/Common";
import { downloadCsv, downloadTemplate, parseCsvFile } from "../../utils/ExportUtils";

function stockTone(stock, minimum) {
  return stock <= minimum ? "bad" : stock <= minimum * 1.5 ? "warn" : "good";
}

function mapProductFromApi(p) {
  return {
    id: p.id,
    product_code: p.product_code,
    product_name: p.product_name,
    generic_name: p.generic_name || "",
    image_url: p.image_url || "",
    category: p.category_name,
    unit: p.unit_name,
    available_quantity: p.available_quantity ?? 0,
    minimum_stock: p.minimum_stock,
    status: p.status || "active",
  };
}

function mapProductToApi(form, categories, units) {
  const category = categories.find((c) => c.name === form.category);
  const unit = units.find((u) => u.name === form.unit);
  return {
    product_code: form.product_code,
    product_name: form.product_name,
    generic_name: form.generic_name || null,
    image_url: form.image_url || null,
    category_id: category ? category.id : null,
    unit_id: unit ? unit.id : null,
    minimum_stock: form.minimum_stock,
    status: form.status,
  };
}

function ProductForm({ initialData, onSubmit, onClose, categories, units, submitting }) {
  const [formData, setFormData] = useState(
    initialData || {
      product_code: "",
      product_name: "",
      generic_name: "",
      image_url: "",
      category: categories[0]?.name || "",
      unit: units[0]?.name || "",
      minimum_stock: 0,
      status: "active",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, minimum_stock: Number(formData.minimum_stock) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Product Code">
          <input required type="text" placeholder="e.g. PRD-1000" value={formData.product_code}
            onChange={(e) => setFormData({ ...formData, product_code: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Minimum Stock">
          <input required type="number" min="0" value={formData.minimum_stock}
            onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Product Name">
        <input required type="text" value={formData.product_name}
          onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} className={inputClass} />
      </FormField>

      <FormField label="Generic Name">
        <input type="text" value={formData.generic_name}
          onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })} className={inputClass} />
      </FormField>

      <FormField label="Product Image">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setFormData((current) => ({ ...current, image_url: reader.result }));
            reader.readAsDataURL(file);
          }}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-teal-500/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-teal-400 hover:file:bg-teal-500/25`}
        />
        {formData.image_url && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#1E2A45] bg-[#0F1626] p-3">
            <img src={formData.image_url} alt="Product preview" className="h-14 w-14 rounded-lg object-cover" />
            <span className="flex-1 text-xs text-[#8B96AE]">Selected image</span>
            <button
              type="button"
              onClick={() => setFormData((current) => ({ ...current, image_url: "" }))}
              className="text-xs font-medium text-rose-400 hover:text-rose-300"
            >
              Remove
            </button>
          </div>
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category">
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClass}>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Unit">
          <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className={inputClass}>
            {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Status">
        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClass}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

const CSV_HEADERS = ["product_code", "product_name", "generic_name", "category", "unit", "minimum_stock", "status"];

function Products() {
  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [catRes, unitRes] = await Promise.all([categoriesApi.getAll(), unitsApi.getAll()]);
        setCategories(catRes.data);
        setUnits(unitRes.data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadLookups();
  }, []);

  const loadProducts = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await productsApi.getAll({ search });
      setProductsList(data.map(mapProductFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAddProduct = async (formData) => {
    setSubmitting(true);
    try {
      await productsApi.create(mapProductToApi(formData, categories, units));
      setIsAddOpen(false);
      await loadProducts(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (formData) => {
    setSubmitting(true);
    try {
      await productsApi.update(editingProduct.id, mapProductToApi(formData, categories, units));
      setEditingProduct(null);
      await loadProducts(query || undefined);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product record?")) return;
    try {
      await productsApi.remove(id);
      await loadProducts(query || undefined);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportProducts = () => {
    downloadCsv(
      "products.csv",
      CSV_HEADERS,
      productsList.map((p) => [p.product_code, p.product_name, p.generic_name, p.category, p.unit, p.minimum_stock, p.status])
    );
  };

  const handleImportProducts = async (file) => {
    try {
      const records = await parseCsvFile(file);
      setSubmitting(true);
      for (const r of records) {
        await productsApi.create(
          mapProductToApi(
            {
              product_code: r.product_code,
              product_name: r.product_name,
              generic_name: r.generic_name,
              category: r.category,
              unit: r.unit,
              minimum_stock: Number(r.minimum_stock || 0),
              status: r.status || "active",
            },
            categories,
            units
          )
        );
      }
      await loadProducts(query || undefined);
      alert(`Imported ${records.length} product(s).`);
    } catch (err) {
      alert(err.message || "Failed to import products.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product List" subtitle="Products / Product List" description="Manage products and their inventory details." onAdd={() => setIsAddOpen(true)} addLabel="Add Product" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search products..."
        extra={
          <>
            <ImportButton label="Import Products" onImport={handleImportProducts} />
            <ActionButton icon={Download} label="Export Products" onClick={handleExportProducts} />
            <ActionButton icon={Download} label="Download Template" onClick={() => downloadTemplate("product-template.csv", CSV_HEADERS)} />
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading products...</p>
      ) : (
        <Table
          columns={[
            { key: "product_code", label: "Code" },
            { key: "product_name", label: "Product Name" },
            { key: "generic_name", label: "Generic Name", render: (r) => r.generic_name || "—" },
            { key: "category", label: "Category", render: (r) => <Badge>{r.category}</Badge> },
            { key: "unit", label: "Unit" },
            { key: "available_quantity", label: "Stock", render: (r) => <Badge tone={stockTone(r.available_quantity, r.minimum_stock)}>{r.available_quantity} {r.unit}</Badge> },
            { key: "minimum_stock", label: "Min Stock" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingProduct(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit Product">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDeleteProduct(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Product">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={productsList}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Product">
        <ProductForm onSubmit={handleAddProduct} onClose={() => setIsAddOpen(false)} categories={categories} units={units} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Update Product Details">
        {editingProduct && (
          <ProductForm initialData={editingProduct} onSubmit={handleEditProduct} onClose={() => setEditingProduct(null)} categories={categories} units={units} submitting={submitting} />
        )}
      </Modal>
    </div>
  );
}

export default Products;


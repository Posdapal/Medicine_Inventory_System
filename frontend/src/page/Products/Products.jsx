import { useEffect, useState } from "react";
import { Trash2, Edit2, Download } from "lucide-react";
import { productsApi, categoriesApi, unitsApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, inputClass,
  ImportButton, ActionButton,
} from "../../components/ui/Common";
import { downloadCsv, downloadXlsx, downloadXlsxTemplate, parseCsvFile } from "../../utils/ExportUtils";
import Swal from 'sweetalert2';

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

      {/* <FormField label="Product Image">
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
      </FormField> */}

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

const CSV_HEADERS = ["Product Code", "Product Name", "Generic Name", "Category Name", "Unit", "Minimum Stock", "Status"];

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
      await productsApi.remove(id);
      await loadProducts(query || undefined);

      Swal.fire("Deleted!", "Product has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the product.", "error");
    }
  };

  const handleExportProducts = () => {
    downloadXlsx(
      "products.xlsx",
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
            <ActionButton icon={Download} label="Download Template" onClick={() => downloadXlsxTemplate("product-template.xlsx", CSV_HEADERS)} />
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
            { key: "minimum_stock", label: "Minimum Stock" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "bad"}>{r.status}</Badge> },
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


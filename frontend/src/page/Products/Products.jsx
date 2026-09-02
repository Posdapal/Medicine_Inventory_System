/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
// Products.jsx — "Product List" (Products > Product List)
// Fields follow the PRODUCTS entity in the ERD: product_code, product_name,
// generic_name, category_id, unit_id, minimum_stock, status.
// Available stock (available_quantity) is aggregated from PRODUCT_BATCHES
// and returned by the API alongside each product for display purposes.
import { useEffect, useState } from "react";
import { Trash2, Edit2, Download } from "lucide-react";
import { productsApi, categoriesApi, unitsApi } from "../../api/endpoints";
import {
  PageHeader, Badge, Table, Toolbar, Modal, FormField, FormInput, FormSelect, inputClass,
  ImportButton, ActionButton, Pagination,
} from "../../components/ui/Common";
import { downloadExcel, downloadTemplate, parseCsvFile } from "../../utils/ExportUtils";
import Swal from 'sweetalert2';
import { toast } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";

function stockTone(stock, minimum) {
  return stock <= minimum ? "bad" : stock <= minimum * 1.5 ? "warn" : "good";
}

function formatStatus(status) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function mapProductFromApi(p) {
  return {
    id: p.id,
    product_code: p.product_code,
    product_name: p.product_name,
    generic_name: p.generic_name || "",
    image_url: p.image_url || "",
    category_id: p.category_id ? String(p.category_id) : "",
    unit_id: p.unit_id ? String(p.unit_id) : "",
    category: p.category_name || "Uncategorized",
    unit: p.unit_name || p.unit_abbreviation || "—",
    available_quantity: p.available_quantity ?? 0,
    minimum_stock: p.minimum_stock,
    status: String(p.status || "active").toLowerCase(),
  };
}

function mapProductToApi(form, categories, units) {
  const categoryId = form.category_id || categories.find((category) => category.name === form.category)?.id;
  const unitId = form.unit_id || units.find((unit) => unit.name === form.unit)?.id;
  return {
    product_code: form.product_code,
    product_name: form.product_name,
    generic_name: form.generic_name || null,
    image_url: form.image_url || null,
    category_id: categoryId ? Number(categoryId) : null,
    unit_id: unitId ? Number(unitId) : null,
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
      category_id: "",
      unit_id: "",
      minimum_stock: "",
      status: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      product_code: formData.product_code.trim(),
      product_name: formData.product_name.trim(),
      generic_name: formData.generic_name.trim(),
      minimum_stock: Number(formData.minimum_stock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Product Code" required type="text" minLength={2} maxLength={30} pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, hyphens, or underscores only." placeholder="e.g. PRD-1000" value={formData.product_code} onChange={(e) => setFormData({ ...formData, product_code: e.target.value })} />
        <FormInput label="Minimum Stock" required type="number" min="0" step="1" inputMode="numeric" placeholder="e.g. 10" value={formData.minimum_stock} onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })} />
      </div>

      <FormInput label="Product Name" required type="text" minLength={2} maxLength={150} placeholder="e.g. Amoxicillin 500 mg" value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} />

      <FormInput label="Generic Name" type="text" maxLength={150} placeholder="e.g. Amoxicillin" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })} />

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
        <FormSelect label="Category" required placeholder="Select a category" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </FormSelect>
        <FormSelect label="Unit" required placeholder="Select a unit" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}>
            {units.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </FormSelect>
      </div>

      <FormSelect label="Status" required placeholder="Select a status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
      </FormSelect>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {submitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

const CSV_HEADERS = ["Product Code", "Product Name", "Generic Name", "Category Name", "Unit", "Minimum Stock", "Status"];

function Products({ navigationFilters = {} }) {
  const { can } = useAuth();
  const canCreate = can("products", "create");
  const canUpdate = can("products", "update");
  const canDelete = can("products", "delete");
  const canImport = can("products", "import");
  const canExport = can("products", "export");
  const canDownloadTemplate = can("products", "download_template");
  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

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

  const loadProducts = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await productsApi.getAll({ search, page, limit, status: navigationFilters.status });
      setProductsList(data.items.map(mapProductFromApi));
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit, navigationFilters.status]);

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
  }, [query]);

  const handleAddProduct = async (formData) => {
    setSubmitting(true);
    try {
      await productsApi.create(mapProductToApi(formData, categories, units));
      setIsAddOpen(false);
      await loadProducts(query || undefined);
    } catch {
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
    } catch {
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

    } catch {
    }
  };

  const handleExportProducts = () => {
    downloadExcel(
      "products.xlsx",
      "Products",
      ["Code", "Product Name", "Generic Name", "Category", "Unit", "Stock", "Min Stock", "Status"],
      productsList.map((p) => [p.product_code, p.product_name, p.generic_name, p.category, p.unit, p.available_quantity, p.minimum_stock, formatStatus(p.status)]),
      (pagination.page - 1) * pagination.limit
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
          ),
          { skipToast: true }
        );
      }
      await loadProducts(query || undefined);
      toast.success(`Imported ${records.length} product(s).`);
    } catch (err) {
      toast.error(err.message || "Failed to import products.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product List" subtitle="Products / Product List" description={navigationFilters.status === "active" ? "Showing active products from the dashboard." : "Manage products and their inventory details."} onAdd={canCreate ? () => setIsAddOpen(true) : undefined} addLabel="Add Product" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search products..."
        extra={
          <>
            {canImport && <ImportButton label="Import Products" onImport={handleImportProducts} />}
            {canExport && <ActionButton icon={Download} label="Export Products" onClick={handleExportProducts} />}
            {canDownloadTemplate && <ActionButton icon={Download} label="Download Template" onClick={() => downloadXlsxTemplate("product-template.xlsx", CSV_HEADERS)} />}
          </>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading products...</p>
      ) : (
        <>
        <Table
          columns={[
            { key: "product_code", label: "Code" },
            { key: "product_name", label: "Product Name" },
            { key: "generic_name", label: "Generic Name", render: (r) => r.generic_name || "—" },
            { key: "category", label: "Category", render: (r) => <Badge>{r.category}</Badge> },
            { key: "unit", label: "Unit" },
            { key: "available_quantity", label: "Stock", render: (r) => <Badge tone={stockTone(r.available_quantity, r.minimum_stock)}>{r.available_quantity} {r.unit}</Badge> },
            { key: "minimum_stock", label: "Min Stock" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{formatStatus(r.status)}</Badge> },
            (canUpdate || canDelete) && {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  {canUpdate && <button onClick={() => setEditingProduct(r)} className="text-[#5D6B85] hover:text-teal-400 transition-colors" title="Edit Product">
                    <Edit2 size={15} />
                  </button>}
                  {canDelete && <button onClick={() => handleDeleteProduct(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete Product">
                    <Trash2 size={15} />
                  </button>}
                </div>
              ),
            },
          ].filter(Boolean)}
          rows={productsList}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))}
        />
        </>
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


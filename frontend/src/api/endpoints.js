import axiosClient from "./axiosClient";

// Every function here resolves to the backend's { success, message, data }
// envelope (axiosClient's response interceptor already unwraps response.data
// for you). Field names throughout this file follow the ERD:
// CATEGORIES, UNITS, PRODUCTS, PRODUCT_BATCHES, SUPPLIERS,
// STOCK_TRANSACTIONS / STOCK_TRANSACTION_ITEMS, STOCK_MOVEMENTS.

export const authApi = {
  login: (email, password) => axiosClient.post("/auth/login", { email, password }),
  me: () => axiosClient.get("/auth/me"),
};

export const dashboardApi = {
  overview: () => axiosClient.get("/dashboard"),
  summary: () => axiosClient.get("/dashboard/summary"),
  stockInOutChart: () => axiosClient.get("/dashboard/stock-in-out-chart"),
};

// CATEGORIES: id, name, description, status
export const categoriesApi = {
  getAll: (params) => axiosClient.get("/categories", { params }),
  create: (data, config) => axiosClient.post("/categories", data, config),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  remove: (id) => axiosClient.delete(`/categories/${id}`),
};

// UNITS: id, name, abbreviation
export const unitsApi = {
  getAll: (params) => axiosClient.get("/units", { params }),
  create: (data) => axiosClient.post("/units", data),
  update: (id, data) => axiosClient.put(`/units/${id}`, data),
  remove: (id) => axiosClient.delete(`/units/${id}`),
};

// PRODUCTS: id, category_id, unit_id, product_code, product_name,
// generic_name, minimum_stock, status
export const productsApi = {
  getAll: (params) => axiosClient.get("/products", { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data, config) => axiosClient.post("/products", data, config),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  remove: (id) => axiosClient.delete(`/products/${id}`),
};

// SUPPLIERS: id, supplier_code, supplier_name, contact_name, phone,
// email, address, status
export const suppliersApi = {
  getAll: (params) => axiosClient.get("/suppliers", { params }),
  getById: (id) => axiosClient.get(`/suppliers/${id}`),
  create: (data) => axiosClient.post("/suppliers", data),
  update: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  remove: (id) => axiosClient.delete(`/suppliers/${id}`),
};

// STOCK_TRANSACTIONS (+ STOCK_TRANSACTION_ITEMS) and STOCK_MOVEMENTS.
// Stock In / Stock Out both create a STOCK_TRANSACTION of the matching
// transaction_type, carrying one or more line items; a PRODUCT_BATCH is
// created (Stock In) or drawn down (Stock Out) per item.
export const stockApi = {
  stockIn: {
    // params: { search }
    getAll: (params) => axiosClient.get("/stock/in", { params }),
    // data: { supplier_id, transaction_date, reference_number, items: [
    //   { product_id, batch_number, manufacture_date, expiry_date, quantity, unit_price }
    // ] }
    create: (data, config) => axiosClient.post("/stock/in", data, config),
    remove: (id) => axiosClient.delete(`/stock/in/${id}`),
  },
  stockOut: {
    getAll: (params) => axiosClient.get("/stock/out", { params }),
    // data: { reason, reference_number, transaction_date, items: [
    //   { product_id, batch_id, quantity }
    // ] }
    create: (data, config) => axiosClient.post("/stock/out", data, config),
    remove: (id) => axiosClient.delete(`/stock/out/${id}`),
  },
  // Aggregated available_quantity per product, from PRODUCT_BATCHES
  current: (params) => axiosClient.get("/stock/current", { params }),
  // STOCK_MOVEMENTS: movement_type, quantity_before, movement_quantity, quantity_after
  history: (params) => axiosClient.get("/stock/history", { params }),
};

// PRODUCT_BATCHES filtered by expiry_date
export const expiryApi = {
  nearExpiry: (params) => axiosClient.get("/expiry/near", { params }),
  expired: (params) => axiosClient.get("/expiry/expired", { params }),
};

export const reportsApi = {
  generate: (params, config = {}) => axiosClient.get("/reports/generate", { ...config, params }),
  getAll: (params) => axiosClient.get("/reports", { params }),
  getById: (id) => axiosClient.get(`/reports/${id}`),
  save: (data) => axiosClient.post("/reports", data),
};

export const settingsApi = {
  get: () => axiosClient.get("/settings"),
  updateProfile: (data) => axiosClient.put("/settings/profile", data),
  updatePreferences: (data) => axiosClient.put("/settings/preferences", data),
  updatePassword: (data) => axiosClient.put("/settings/password", data),
  updateTwoFactor: (enabled) => axiosClient.put("/settings/two-factor", { enabled }),
};

// Add this export to your existing api/endpoints.js (next to usersApi)
export const permissionsApi = {
  getForUser: (userId) => axiosClient.get(`/permissions/${userId}`),
  updateForUser: (userId, permissions) => axiosClient.put(`/permissions/${userId}`, { permissions }),
};

export const usersApi = {
  getAll: (params) => axiosClient.get("/users", { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post("/users", data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  remove: (id) => axiosClient.delete(`/users/${id}`),
};


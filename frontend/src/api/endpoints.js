import axiosClient from "./axiosClient";

// Every function here resolves to the backend's { success, message, data }
// envelope (axiosClient's response interceptor already unwraps response.data
// for you), so callers do `const { data } = await patientsApi.getAll()`.

export const authApi = {
  login: (email, password) => axiosClient.post("/auth/login", { email, password }),
  me: () => axiosClient.get("/auth/me"),
};

export const dashboardApi = {
  summary: () => axiosClient.get("/dashboard/summary"),
  usageChart: () => axiosClient.get("/dashboard/usage-chart"),
  stockChart: () => axiosClient.get("/dashboard/stock-chart"),
  lowStock: () => axiosClient.get("/dashboard/low-stock"),
};

export const patientsApi = {
  getAll: (search) => axiosClient.get("/patients", { params: { search } }),
  getById: (id) => axiosClient.get(`/patients/${id}`),
  create: (data) => axiosClient.post("/patients", data),
  update: (id, data) => axiosClient.put(`/patients/${id}`, data),
  remove: (id) => axiosClient.delete(`/patients/${id}`),
};

export const medicinesApi = {
  getAll: (params) => axiosClient.get("/medicines", { params }),
  getById: (id) => axiosClient.get(`/medicines/${id}`),
  stockHistory: (id) => axiosClient.get(`/medicines/${id}/stock-history`),
  create: (data) => axiosClient.post("/medicines", data),
  update: (id, data) => axiosClient.put(`/medicines/${id}`, data),
  remove: (id) => axiosClient.delete(`/medicines/${id}`),
};

export const suppliersApi = {
  getAll: (search) => axiosClient.get("/suppliers", { params: { search } }),
  getById: (id) => axiosClient.get(`/suppliers/${id}`),
  create: (data) => axiosClient.post("/suppliers", data),
  update: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  remove: (id) => axiosClient.delete(`/suppliers/${id}`),
};

export const categoriesApi = {
  getAll: (type) => axiosClient.get("/categories", { params: { type } }),
  create: (data) => axiosClient.post("/categories", data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  remove: (id) => axiosClient.delete(`/categories/${id}`),
};

export const productsApi = {
  getAll: (params) => axiosClient.get("/products", { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data) => axiosClient.post("/products", data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  remove: (id) => axiosClient.delete(`/products/${id}`),
};

export const prescriptionsApi = {
  getAll: (params) => axiosClient.get("/prescriptions", { params }),
  getById: (id) => axiosClient.get(`/prescriptions/${id}`),
  create: (data) => axiosClient.post("/prescriptions", data),
  updateStatus: (id, status) => axiosClient.patch(`/prescriptions/${id}/status`, { status }),
  remove: (id) => axiosClient.delete(`/prescriptions/${id}`),
};

export const reportsApi = {
  generate: (params) => axiosClient.get("/reports/generate", { params }),
  getAll: () => axiosClient.get("/reports"),
  getById: (id) => axiosClient.get(`/reports/${id}`),
  save: (data) => axiosClient.post("/reports", data),
};

export const usersApi = {
  getAll: (search) => axiosClient.get("/users", { params: { search } }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post("/users", data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  remove: (id) => axiosClient.delete(`/users/${id}`),
};

export const settingsApi = {
  get: () => axiosClient.get("/settings"),
  updateProfile: (data) => axiosClient.put("/settings/profile", data),
  updatePreferences: (data) => axiosClient.put("/settings/preferences", data),
  updatePassword: (data) => axiosClient.put("/settings/password", data),
  updateTwoFactor: (enabled) => axiosClient.put("/settings/two-factor", { enabled }),
};

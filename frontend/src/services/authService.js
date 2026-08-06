import api from "./api";

const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  profile: () => api.get("/auth/profile"),
  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

export default authService;

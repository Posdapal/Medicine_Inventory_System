/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Trash2, X, Edit2, Eye, EyeOff } from "lucide-react";
import { usersApi, rolesApi } from "../../api/endpoints";
import Swal from "sweetalert2";
import { FormInput, FormSelect, Pagination, Table } from "../../components/ui/Common";

const normalizeRole = (role) => ({
  id: String(role.id ?? role.role_id ?? ""),
  name: role.name ?? role.role ?? "",
});

const isRetiredRole = (role) => String(role?.name || "").trim().toLowerCase() === "staff";
const displayRole = (role) => String(role || "").trim().toLowerCase() === "staff" ? "Stock Staff" : role;

const normalizeRoleId = (value) => String(value ?? "");

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#8B96AE] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Toolbar({ query, setQuery, placeholder, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="relative w-full max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E7ECF6] placeholder-[#5D6B85] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
        />
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg"
        >
          <Plus size={15} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return createPortal(
    <>
      <div className="fixed left-0 top-0 z-[9998] h-[100dvh] w-screen bg-black/45" aria-hidden="true" />
      <div className={`fixed bottom-0 right-0 top-0 z-[9999] flex items-center justify-center p-4 ${wide ? "left-[var(--app-sidebar-width)]" : "left-0"}`}>
        <div className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${wide ? "max-w-[1280px]" : "max-w-md"}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-medium text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}

function mapUserFromApi(u) {
  return {
    id: u.id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: displayRole(u.role),
    roleId: normalizeRoleId(u.role_id ?? u.roleId),
    status: u.status,
  };
}

// UserForm doubles as add + edit. Password is only collected (and sent) on create,
// since the backend has no admin "reset password" endpoint yet — only the user's
// own /settings/password flow can change it.
function UserForm({ initialData, onSubmit, onClose, submitting, roles }) {
  const isEdit = !!initialData;
  const [showPassword, setShowPassword] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [formData, setFormData] = useState(
    initialData || { name: "", username: "", email: "", password: "", roleId: "", status: "active" }
  );
  const selectedRoleId = normalizeRoleId(formData.roleId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setRoleError("Please select a role.");
      return;
    }
    onSubmit({
      ...formData,
      roleId: selectedRoleId,
      name: formData.name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="Full Name" required type="text" minLength={2} maxLength={100} autoComplete="name" placeholder="e.g. Jane Smith" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

      <FormInput label="Username" required type="text" minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" title="Use letters, numbers, periods, hyphens, or underscores only." autoComplete="username" placeholder="e.g. jane.smith" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />

      <FormInput label="Email Address" required type="email" maxLength={120} autoComplete="email" placeholder="e.g. jane@pharmacy.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

      {!isEdit && (
        <FormInput
          label="Temporary Password"
          required
          type={showPassword ? "text" : "password"}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8 or more characters."
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          trailingAction={(
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide temporary password" : "Show temporary password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
              className="rounded-md p-1 text-[#697791] transition hover:bg-slate-200/60 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-white/[0.06]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="Role" required placeholder="Select a role" error={roleError}
            value={selectedRoleId}
            onChange={(e) => { setRoleError(""); setFormData({ ...formData, roleId: e.target.value }); }}
          >
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </FormSelect>
        <FormSelect label="Status" required placeholder="Select a status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
        </FormSelect>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : "Save User"}
        </button>
      </div>
    </form>
  );
}

function Users({ navigationFilters = {} }) {
  const [usersList, setUsersList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);      // basic profile edit
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const loadUsers = async (search, page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await usersApi.getAll({ search, page, limit, status: navigationFilters.status });
      setUsersList(data.items.map(mapUserFromApi));
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    rolesApi.getAll({ active: true }).then(({ data }) => setRoles((data || []).map(normalizeRole).filter((role) => role.id && !isRetiredRole(role))));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit, navigationFilters.status]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAddUser = async (formData) => {
    if (!formData.roleId) {
      await Swal.fire({ icon: "warning", title: "Role required", text: "Please select a role." });
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.create({
        full_name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
        status: formData.status,
      });
      setIsAddOpen(false);
      await loadUsers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (formData) => {
    if (!formData.roleId) {
      await Swal.fire({ icon: "warning", title: "Role required", text: "Please select a role." });
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.update(editingUser.id, {
        full_name: formData.name,
        username: formData.username,
        email: formData.email,
        roleId: formData.roleId,
        status: formData.status,
      });
      setEditingUser(null);
      await loadUsers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
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
      showClass: { popup: "animate__animated animate__fadeInUp animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutDown animate__faster" },
    });

    // Cancel or dismiss (clicking outside, Esc) both land here and just stop
    if (!result.isConfirmed) return;

    try {
      await usersApi.remove(id);
      await loadUsers(query || undefined);
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Roles and access control" />

      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search users..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add User"
      />

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading users...</p>
      ) : (
        <>
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (r) => <Badge tone="neutral">{r.role}</Badge> },
            {
              key: "status",
              label: "Status",
              render: (r) => {
                const status = String(r.status || "").trim().toLowerCase();
                const tone = status === "active" ? "good" : status === "inactive" ? "bad" : "neutral";
                return <Badge tone={tone}>{r.status || "Unknown"}</Badge>;
              },
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingUser(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit User">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDeleteUser(r.id)} className="text-[#5D6B85] hover:text-rose-400 transition-colors" title="Delete User">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={usersList}
          rowOffset={(pagination.page - 1) * pagination.limit}
        />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))} />
        </>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New System User">
        <UserForm roles={roles} onSubmit={handleAddUser} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        {editingUser && (
          <UserForm
            initialData={editingUser}
            onSubmit={handleEditUser}
            onClose={() => setEditingUser(null)}
            submitting={submitting}
            roles={roles}
          />
        )}
      </Modal>

    </div>
  );
}

export default Users;

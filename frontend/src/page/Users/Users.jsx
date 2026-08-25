/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2, ShieldCheck } from "lucide-react";
import { usersApi, permissionsApi } from "../../api/endpoints";
import Swal from "sweetalert2";
import { FormInput, FormSelect, Pagination, Table } from "../../components/ui/Common";

// Modules that carry per-user CRUD permissions. Keep in sync with the
// backend's VALID_MODULES (src/middleware/auth.middleware.js).
const MODULES = [
  { key: "products", label: "Products" },
  { key: "suppliers", label: "Suppliers" },
  { key: "categories", label: "Categories" },
  { key: "stock", label: "Stock In/Out" },
  { key: "reports", label: "Reports" },
];
const ACTIONS = [
  { key: "can_create", label: "Create" },
  { key: "can_read", label: "Read" },
  { key: "can_update", label: "Update" },
  { key: "can_delete", label: "Delete" },
];

// Role names as stored in the `roles` table (see medicine_inventory.sql seed data).
// Keep this in sync with the DB -- do not use "admin"/"user", those don't exist as role names.
const ROLE_ADMIN = "Administrator";
const ROLE_STAFF = "Staff";
const isAdminRole = (role) => (role || "").toLowerCase() === ROLE_ADMIN.toLowerCase();

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2A45]">
          <h3 className="text-lg font-medium text-[#E7ECF6]">{title}</h3>
          <button onClick={onClose} className="text-[#5D6B85] hover:text-[#E7ECF6] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function mapUserFromApi(u) {
  return {
    id: u.id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: u.role, // "Administrator" or "Staff", straight from roles.name via the API
    status: u.status,
  };
}

// UserForm doubles as add + edit. Password is only collected (and sent) on create,
// since the backend has no admin "reset password" endpoint yet — only the user's
// own /settings/password flow can change it.
function UserForm({ initialData, onSubmit, onClose, submitting }) {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState(
    initialData || { name: "", username: "", email: "", password: "", role: "", status: "" }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
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
        <FormInput label="Temporary Password" required type="password" minLength={8} maxLength={128} autoComplete="new-password" placeholder="At least 8 characters" hint="Use 8 or more characters." value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="System Role" required placeholder="Select a role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value={ROLE_STAFF}>Staff</option>
            <option value={ROLE_ADMIN}>Administrator</option>
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
          className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
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

// Module x CRUD-action checkbox grid. Admin accounts get a read-only
// "full access" notice instead, since admins can't have permissions edited.
function PermissionsForm({ targetUser, onClose, submitting, onSave }) {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(null); // { module: { can_create, can_read, can_update, can_delete } }
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await permissionsApi.getForUser(targetUser.id);
        if (!cancelled) setPermissions(data.permissions);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetUser.id]);

  const toggle = (moduleKey, actionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [actionKey]: !prev[moduleKey][actionKey] },
    }));
  };

  const toggleRow = (moduleKey, on) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        can_create: on, can_read: on, can_update: on, can_delete: on,
      },
    }));
  };

  if (isAdminRole(targetUser.role)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#D7DEEB] bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
          <ShieldCheck size={16} className="text-blue-400 shrink-0" />
          Admin accounts always have full create/read/update/delete access everywhere.
          Permissions can only be customized for staff (role = "Staff").
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-[#8B96AE]">Loading permissions...</p>;
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8B96AE]">
        Choose exactly which modules <span className="text-[#E7ECF6] font-medium">{targetUser.name}</span> can create,
        read, update, or delete. Unchecked = no access.
      </p>

      <div className="overflow-x-auto border border-[#1E2A45] rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              <th className="px-3 py-2 font-medium">Module</th>
              {ACTIONS.map((a) => (
                <th key={a.key} className="px-3 py-2 font-medium text-center">{a.label}</th>
              ))}
              <th className="px-3 py-2 font-medium text-center">All</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => {
              const row = permissions[m.key] || {};
              const allOn = ACTIONS.every((a) => row[a.key]);
              return (
                <tr key={m.key} className="border-b border-[#1E2A45] last:border-0">
                  <td className="px-3 py-2 text-[#D7DEEB]">{m.label}</td>
                  {ACTIONS.map((a) => (
                    <td key={a.key} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!row[a.key]}
                        onChange={() => toggle(m.key, a.key)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={allOn}
                      onChange={(e) => toggleRow(m.key, e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6] hover:bg-white/[0.02] text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => onSave(permissions)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}

function Users({ navigationFilters = {} }) {
  const [usersList, setUsersList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);      // basic profile edit
  const [permissionsUser, setPermissionsUser] = useState(null); // permissions modal target
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
    const timeout = setTimeout(() => loadUsers(query || undefined, pagination.page, pagination.limit), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page, pagination.limit, navigationFilters.status]);

  useEffect(() => { setPagination((current) => ({ ...current, page: 1 })); }, [query]);

  const handleAddUser = async (formData) => {
    setSubmitting(true);
    try {
      await usersApi.create({
        full_name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      setIsAddOpen(false);
      await loadUsers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (formData) => {
    setSubmitting(true);
    try {
      await usersApi.update(editingUser.id, {
        full_name: formData.name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      });
      setEditingUser(null);
      await loadUsers(query || undefined);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePermissions = async (permissions) => {
    setSubmitting(true);
    try {
      await permissionsApi.updateForUser(permissionsUser.id, permissions);
      setPermissionsUser(null);
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
            { key: "role", label: "Role", render: (r) => <Badge tone={isAdminRole(r.role) ? "info" : "neutral"}>{r.role}</Badge> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{r.status}</Badge> },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingUser(r)} className="text-[#5D6B85] hover:text-blue-400 transition-colors" title="Edit User">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setPermissionsUser(r)} className="text-[#5D6B85] hover:text-emerald-400 transition-colors" title="Manage Permissions">
                    <ShieldCheck size={15} />
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
        <UserForm onSubmit={handleAddUser} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        {editingUser && (
          <UserForm
            initialData={editingUser}
            onSubmit={handleEditUser}
            onClose={() => setEditingUser(null)}
            submitting={submitting}
          />
        )}
      </Modal>

      <Modal isOpen={!!permissionsUser} onClose={() => setPermissionsUser(null)} title="Manage Access Permissions" wide>
        {permissionsUser && (
          <PermissionsForm
            targetUser={permissionsUser}
            onClose={() => setPermissionsUser(null)}
            submitting={submitting}
            onSave={handleSavePermissions}
          />
        )}
      </Modal>
    </div>
  );
}

export default Users;

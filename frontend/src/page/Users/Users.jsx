import { useEffect, useState } from "react";
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react";
import { usersApi } from "../../api/endpoints";
import Swal from 'sweetalert2';

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

function Table({ columns, rows }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F1626] border border-[#1E2A45] rounded-xl shadow-2xl overflow-hidden">
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
    role: u.role,
    status: u.status,
  };
}

// UserForm doubles as add + edit. Password is only collected (and sent) on create,
// since the backend has no admin "reset password" endpoint yet — only the user's
// own /settings/password flow can change it.
function UserForm({ initialData, onSubmit, onClose, submitting }) {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState(
    initialData || { name: "", username: "", email: "", password: "", role: "user", status: "active" }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Full Name</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Username</label>
        <input
          required
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Email Address</label>
        <input
          required
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Temporary Password</label>
          <input
            required
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">System Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B96AE] uppercase mb-1.5">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[#070B12] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
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

function Users() {
  const [usersList, setUsersList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadUsers = async (search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await usersApi.getAll(search);
      setUsersList(data.map(mapUserFromApi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(query || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // const handleDeleteUser = async (id) => {
  //   if (!confirm("Are you sure you want to delete this user?")) return;
  //   try {
  //     await usersApi.remove(id);
  //     await loadUsers(query || undefined);
  //   } catch (err) {
  //     alert(err.message);
  //   }
  // };

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
      await usersApi.remove(id);
      await loadPatients(query || undefined);

      Swal.fire("Deleted!", "Patient has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error!", "An error occurred while deleting the patient.", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
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
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (r) => <Badge tone={r.role === "admin" ? "info" : "neutral"}>{r.role}</Badge> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{r.status}</Badge> },
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
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New System User">
        <UserForm onSubmit={handleAddUser} onClose={() => setIsAddOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Update Account Permissions">
        {editingUser && (
          <UserForm
            initialData={editingUser}
            onSubmit={handleEditUser}
            onClose={() => setEditingUser(null)}
            submitting={submitting}
          />
        )}
      </Modal>
    </div>
  );
}

export default Users;

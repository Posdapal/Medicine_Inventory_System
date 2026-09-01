import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { settingsApi } from "../../api/endpoints";

function PasswordField({ label, placeholder, value, onChange, autoComplete, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}<span className="text-rose-400">*</span>
      </span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          className={`min-h-12 w-full rounded-xl border bg-slate-800/70 px-4 pr-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-4 ${
            error
              ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/10"
              : "border-slate-700/80 hover:border-slate-600 focus:border-teal-400/70 focus:ring-teal-400/10"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
      {error && <span className="mt-2 block text-sm text-rose-400">{error}</span>}
    </label>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.current_password) {
      nextErrors.current_password = "Current password is required.";
    }

    if (!form.new_password) {
      nextErrors.new_password = "New password is required.";
    } else if (form.new_password.length < 8) {
      nextErrors.new_password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(form.new_password)) {
      nextErrors.new_password = "Password must include at least 1 uppercase letter.";
    } else if (!/[a-z]/.test(form.new_password)) {
      nextErrors.new_password = "Password must include at least 1 lowercase letter.";
    } else if (!/\d/.test(form.new_password)) {
      nextErrors.new_password = "Password must include at least 1 number.";
    } else if (!/[^A-Za-z0-9]/.test(form.new_password)) {
      nextErrors.new_password = "Password must include at least 1 special character.";
    } else if (form.new_password === form.current_password) {
      nextErrors.new_password = "New password must be different from your current password.";
    }

    if (!form.confirm_password) {
      nextErrors.confirm_password = "Please confirm your new password.";
    } else if (form.confirm_password !== form.new_password) {
      nextErrors.confirm_password = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setSaving(true);
    setSubmitError("");
    try {
      await settingsApi.updatePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      await Swal.fire({
        title: "Password changed",
        text: "Your password was updated successfully.",
        icon: "success",
      });
    } catch (error) {
      const message = error.message || "Unable to change password. Please try again.";
      if (message.toLowerCase().includes("current password is incorrect")) {
        setErrors((current) => ({ ...current, current_password: "Current password is incorrect." }));
      } else {
        setSubmitError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full">
      <h2 className="mb-8 text-xl font-semibold text-slate-100">Change Password</h2>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-7"
      >
        {submitError && (
          <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            {submitError}
          </div>
        )}
        <PasswordField
          label="Current Password"
          placeholder="Enter your current password"
          value={form.current_password}
          onChange={updateField("current_password")}
          autoComplete="current-password"
          error={errors.current_password}
        />
        <PasswordField
          label="New Password"
          placeholder="Enter your new password"
          value={form.new_password}
          onChange={updateField("new_password")}
          autoComplete="new-password"
          error={errors.new_password}
        />
        <PasswordField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={form.confirm_password}
          onChange={updateField("confirm_password")}
          autoComplete="new-password"
          error={errors.confirm_password}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal-400 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}

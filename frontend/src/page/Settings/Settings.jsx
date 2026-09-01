/* eslint-disable no-empty -- mutation errors are displayed by the global API interceptor */
import { useContext, useEffect, useMemo, useState } from "react";
import { BellRing, KeyRound, LockKeyhole, Mail, Palette, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { settingsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { ThemeCotext } from "../../context/ThemeContextProvider";
import { Alert, Badge, Button, Card, ChecklistItem, Input, Tabs } from "../../components/ui/Primitives";

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="min-h-12 w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-4 text-sm text-slate-100 outline-none transition hover:border-slate-600 focus:border-teal-400/70 focus:ring-4 focus:ring-teal-400/10"
      >
        {children}
      </select>
    </label>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-800 bg-slate-950/35 p-4">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${checked ? "bg-teal-500" : "bg-slate-700"}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function Settings() {
  const { logout } = useAuth();
  const { theme, setTheme } = useContext(ThemeCotext);
  const [tab, setTab] = useState("preferences");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState("English");
  const [preferences, setPreferences] = useState({ notifications_telegram: true, notifications_email: true });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });

  const tabs = [
    { key: "preferences", label: "Preferences", icon: Palette },
    { key: "security", label: "Security", icon: ShieldCheck },
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await settingsApi.get();
        setPreferences({
          notifications_telegram: !!data.notifications_telegram,
          notifications_email: !!data.notifications_email,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const togglePreference = async (key) => {
    const previous = preferences;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      await settingsApi.updatePreferences(next);
    } catch (err) {
      setPreferences(previous);
      setError(err.message);
    }
  };

  const passwordChecks = useMemo(() => ({
    length: passwordForm.new_password.length >= 8,
    upper: /[A-Z]/.test(passwordForm.new_password),
    number: /\d/.test(passwordForm.new_password),
    special: /[^A-Za-z0-9]/.test(passwordForm.new_password),
  }), [passwordForm.new_password]);

  const savePassword = async () => {
    const strong = Object.values(passwordChecks).every(Boolean);
    if (!passwordForm.current_password || !strong || passwordForm.new_password !== passwordForm.confirm_password) {
      Swal.fire({
        title: "Check your password",
        text: "Complete every password requirement and make sure both new passwords match.",
        icon: "warning",
        background: "#0f172a",
        color: "#f1f5f9",
      });
      return;
    }
    setSaving(true);
    try {
      await settingsApi.updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6 rounded-2xl border border-[#1E2A45] bg-[#111A2C]/90 px-5 py-5 shadow-xl shadow-black/10 sm:px-6">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#5e5e5e]">
          <span>Settings</span><span aria-hidden="true">/</span><span className="text-teal-400">Account Center</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge>Account center</Badge>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">Secure workspace</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-300 sm:text-3xl">Settings</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Manage your personal information, workspace preferences, and account security.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <ShieldCheck size={16} className="text-emerald-400" />
          Your information is securely protected
        </div>
        </div>
      </header>

      <div className="space-y-5">
        {error && (
          <Alert
            title="Your session has expired. Please log in again."
            action={<Button onClick={logout} className="w-full sm:w-auto">Login Again</Button>}
          >
            Sign in to securely access and update your account settings.
          </Alert>
        )}

        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-shadow-black/10 from-slate-100 to-teal-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-300">
                {tab === "preferences" && <Palette size={21} />}
                {tab === "security" && <LockKeyhole size={21} />}
              </span>
              <div>
                <h3 className="font-semibold text-slate-100">
                  {tab === "preferences" ? "Workspace preferences" : "Password & security"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-100">
                  {tab === "preferences" ? "Personalize how the system works for you." : "Use a strong, unique password to protect your account."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {loading ? (
              <div className="grid max-w-4xl gap-5 md:grid-cols-2">
                {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />)}
              </div>
            ) : tab === "preferences" ? (
              <div className="max-w-4xl space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <SelectField label="Theme Mode" value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="dark">Dark mode</option>
                    <option value="light">Light mode</option>
                  </SelectField>
                  <SelectField label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Khmer</option>
                  </SelectField>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><BellRing size={16} className="text-teal-300" /> Notification Preference</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle checked={preferences.notifications_telegram} onChange={() => togglePreference("notifications_telegram")} label="Telegram notifications" description="Receive stock and expiry alerts by Telegram" />
                    <Toggle checked={preferences.notifications_email} onChange={() => togglePreference("notifications_email")} label="Email notifications" description="Receive urgent inventory alerts by Email." />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid max-w-5xl gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                <div className="space-y-5">
                  <Input label="Current Password" type="password" placeholder="Enter current password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                  <Input label="New Password" type="password" placeholder="Create a strong password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
                  <Input label="Confirm Password" type="password" placeholder="Re-enter new password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
                  <div className="border-t border-slate-800 pt-6">
                    <Button onClick={savePassword} disabled={saving}><KeyRound size={17} />{saving ? "Saving..." : "Save Password"}</Button>
                  </div>
                </div>
                <div className="h-fit rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200"><ShieldCheck size={17} className="text-teal-300" /> Strong password checklist</div>
                  <ul className="space-y-3">
                    <ChecklistItem valid={passwordChecks.length}>At least 8 characters</ChecklistItem>
                    <ChecklistItem valid={passwordChecks.upper}>One uppercase letter</ChecklistItem>
                    <ChecklistItem valid={passwordChecks.number}>One number</ChecklistItem>
                    <ChecklistItem valid={passwordChecks.special}>One special character</ChecklistItem>
                    <ChecklistItem valid={passwordForm.confirm_password !== "" && passwordForm.new_password === passwordForm.confirm_password}>Passwords match</ChecklistItem>
                  </ul>
                  <div className="mt-5 flex gap-2 rounded-xl bg-teal-400/[0.06] p-3 text-xs leading-relaxed text-teal-500">
                    <Mail size={15} className="mt-0.5 shrink-0 text-teal-400" />
                    Never share your password or verification details with anyone.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Settings;

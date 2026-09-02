import { useContext, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Boxes,
  Filter,
  History,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  Palette,
  PackageMinus,
  PackagePlus,
  Save,
  ShieldCheck,
  Tag,
  UserCog,
  UserRound,
} from "lucide-react";
import Swal from "sweetalert2";
import { settingsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { ThemeCotext } from "../../context/ThemeContextProvider";
import { Alert, Badge, Button, Card, ChecklistItem, Input, Tabs } from "../../components/ui/Primitives";

function SelectField({ label, value, onChange, children, disabled = false }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${disabled ? "text-slate-500" : "text-slate-200"}`}>
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`min-h-12 w-full rounded-xl border px-4 text-sm outline-none transition ${
          disabled
            ? "cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-500 opacity-60"
            : "border-slate-700/80 bg-slate-800/70 text-slate-100 hover:border-slate-600 focus:border-teal-400/70 focus:ring-4 focus:ring-teal-400/10"
        }`}
      >
        {children}
      </select>
    </label>
  );
}

function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-5 rounded-xl border p-4 ${
        disabled ? "border-slate-800/60 bg-slate-950/20 opacity-60" : "border-slate-800 bg-slate-950/35"
      }`}
    >
      <div>
        <p className={`text-sm font-medium ${disabled ? "text-slate-500" : "text-slate-200"}`}>{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={disabled ? undefined : onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
          disabled ? "cursor-not-allowed bg-slate-700/60" : checked ? "bg-teal-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full shadow-md transition-transform ${
            disabled ? "bg-slate-400" : "bg-white"
          } ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Log — read-only audit trail (stock changes, price updates, logins)
// ---------------------------------------------------------------------------

const ACTIVITY_TYPE_META = {
  stock_in: { label: "Stock in", icon: PackagePlus, color: "text-emerald-300 bg-emerald-400/10" },
  stock_out: { label: "Stock out", icon: PackageMinus, color: "text-amber-300 bg-amber-400/10" },
  price_update: { label: "Price change", icon: Tag, color: "text-sky-300 bg-sky-400/10" },
  login: { label: "Login", icon: LogIn, color: "text-slate-300 bg-slate-400/10" },
  role_change: { label: "Role change", icon: UserCog, color: "text-purple-300 bg-purple-400/10" },
  password_change: { label: "Password", icon: KeyRound, color: "text-teal-300 bg-teal-400/10" },
};

const ACTIVITY_FILTERS = [
  { key: "all", label: "All activity" },
  { key: "stock_in", label: "Stock in" },
  { key: "stock_out", label: "Stock out" },
  { key: "price_update", label: "Price changes" },
  { key: "login", label: "Logins" },
  { key: "role_change", label: "Role changes" },
  { key: "password_change", label: "Password" },
];

function formatActivityTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

function ActivityRow({ entry }) {
  const meta = ACTIVITY_TYPE_META[entry.type];
  const Icon = meta.icon;
  return (
    <li className="flex items-start gap-4 border-b border-slate-800/70 px-1 py-4 last:border-b-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-slate-200">{entry.detail}</p>
          {entry.danger && (
            <span className="rounded-md bg-red-400/10 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
              Flagged
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="text-slate-400">{entry.actor}</span>
          <span className="text-slate-700">•</span>
          <span>{entry.meta}</span>
        </div>
      </div>
      <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">{formatActivityTime(entry.time)}</span>
    </li>
  );
}

function ActivityLogPanel({ entries, loading }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.type === filter)),
    [entries, filter]
  );

  const stockOutCount = entries.filter((e) => e.type === "stock_out").length;
  const loginCount = entries.filter((e) => e.type === "login").length;
  const flaggedCount = entries.filter((e) => e.danger).length;

  if (loading) {
    return (
      <div className="max-w-4xl space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-800/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Boxes size={14} className="text-teal-300" /> Stock changes today
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-100">{stockOutCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <LogIn size={14} className="text-teal-300" /> Sign-ins this week
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-100">{loginCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-teal-300" /> Flagged events
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-100">{flaggedCount}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="shrink-0 text-slate-500" />
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "bg-teal-500/15 text-teal-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/30 px-4">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No activity for this filter.</p>
        ) : (
          <ul>
            {filtered.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        Activity is read-only and retained for 90 days. Contact an admin if you notice something unfamiliar.
      </p>
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
  const [profile, setProfile] = useState({ full_name: "", email: "", address: "", date_of_birth: "", gender: "" });
  const [preferences, setPreferences] = useState({ notifications_telegram: true, notifications_email: false });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const tabs = [
    { key: "preferences", label: "Preferences", icon: Palette },
    // { key: "activity", label: "Activity Log", icon: History },
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await settingsApi.get();
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          address: data.address || "",
          date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : "",
          gender: data.gender || "",
        });
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

  useEffect(() => {
    async function loadActivity() {
      setActivityLoading(true);
      try {
        // Replace with a real endpoint, e.g. settingsApi.getActivityLog()
        // Each entry: { id, type, actor, detail, meta, time, danger? }
        const { data } = await settingsApi.getActivityLog();
        setActivity(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setActivityLoading(false);
      }
    }
    loadActivity();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(profile);
    } catch {
    } finally {
      setSaving(false);
    }
  };

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

  const tabTitle =
    tab === "profile"
      ? "Personal information"
      : tab === "preferences"
      ? "Workspace preferences"
      : tab === "activity"
      ? "Activity log"
      : "Password & security";

  const tabSubtitle =
    tab === "profile"
      ? "Keep your account details accurate and up to date."
      : tab === "preferences"
      ? "Personalize how the system works for you."
      : tab === "activity"
      ? "A read-only record of stock changes, price updates, and sign-ins."
      : "Use a strong, unique password to protect your account.";

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
            Manage your workspace preferences and review account activity.
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
                {tab === "profile" && <UserRound size={21} />}
                {tab === "preferences" && <Palette size={21} />}
                {tab === "security" && <LockKeyhole size={21} />}
                {tab === "activity" && <History size={21} />}
              </span>
              <div>
                <h3 className="font-semibold text-slate-100">{tabTitle}</h3>
                <p className="mt-0.5 text-xs text-slate-100">{tabSubtitle}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {tab === "profile" && (
              loading ? (
                <div className="grid max-w-4xl gap-5 md:grid-cols-2">
                  {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />)}
                </div>
              ) : (
                <div className="max-w-4xl">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input label="Full Name" placeholder="Enter your full name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                    <Input label="Email" type="email" placeholder="name@pharmacy.com" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    <Input label="Address" placeholder="Street, city, state" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="md:col-span-2" />
                  </div>
                  <div className="mt-7 flex border-t border-slate-800 pt-6">
                    <Button onClick={saveProfile} disabled={saving}><Save size={17} />{saving ? "Saving..." : "Save Changes"}</Button>
                  </div>
                </div>
              )
            )}

            {tab === "preferences" && (
              loading ? (
                <div className="grid max-w-4xl gap-5 md:grid-cols-2">
                  {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />)}
                </div>
              ) : (
                <div className="max-w-4xl space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <SelectField label="Theme Mode" value={theme} onChange={(e) => setTheme(e.target.value)}>
                      <option value="dark">Dark mode</option>
                      <option value="light">Light mode</option>
                    </SelectField>
                    <SelectField
                      label="Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled
                    >
                      <option>English</option>
                      <option>Khmer</option>
                    </SelectField>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><BellRing size={16} className="text-teal-300" /> Notification Preference</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Toggle checked={preferences.notifications_telegram} onChange={() => togglePreference("notifications_telegram")} label="Telegram notifications" description="Receive stock and expiry alerts by Telegram" />
                      <Toggle
                        checked={preferences.notifications_email}
                        onChange={() => togglePreference("notifications_email")}
                        label="Email notifications"
                        description="Receive urgent inventory alerts by Email."
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )
            )}

            {tab === "security" && (
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

            {tab === "activity" && (
              <ActivityLogPanel entries={activity} loading={activityLoading} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Settings;

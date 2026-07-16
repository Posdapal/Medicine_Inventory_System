import React, { useEffect, useState } from "react";
import { settingsApi } from "../../api/endpoints";
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

function Card({ children, className = "" }) {
  return <div className={`bg-[#141E33] border border-[#1E2A45] rounded-xl ${className}`}>{children}</div>;
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

function Settings() {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ full_name: "", email: "", address: "", date_of_birth: "", gender: "" });
  const [preferences, setPreferences] = useState({ notifications_email: false, notifications_sms: false });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "preferences", label: "Preferences" },
    { key: "security", label: "Security" },
  ];

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");
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
          notifications_email: !!data.notifications_email,
          notifications_sms: !!data.notifications_sms,
        });
        setTwoFactorEnabled(!!data.two_factor_enabled);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // const saveProfile = async () => {
  //   setSaving(true);
  //   try {
  //     await settingsApi.updateProfile(profile);
  //     alert("Profile updated.");
  //   } catch (err) {
  //     alert(err.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(profile);
      Swal.fire({
        title: "Profile updated.",
        icon: "success",
        draggable: true,
        background: "#141E33",
        color: "#ffffff",
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message,
        icon: "error",
        draggable: true,
        background: "#141E33",
        color: "#ffffff",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      await settingsApi.updatePreferences(next);
    } catch (err) {
      alert(err.message);
      setPreferences(preferences); // revert on failure
    }
  };

  // const savePassword = async () => {
  //   if (!passwordForm.current_password || !passwordForm.new_password) {
  //     alert("Please fill in both password fields.");
  //     return;
  //   }
  //   setSaving(true);
  //   try {
  //     await settingsApi.updatePassword(passwordForm);
  //     setPasswordForm({ current_password: "", new_password: "" });
  //     alert("Password updated.");
  //   } catch (err) {
  //     alert(err.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: "#141E33",
    color: "#ffffff",
  });

  const savePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      Swal.fire({
        title: "Missing fields",
        text: "Please fill in both password fields.",
        icon: "warning",
        background: "#141E33",
        color: "#ffffff",
      });
      return;
    }

    setSaving(true);
    try {
      await settingsApi.updatePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "" });
      Toast.fire({
        title: "Password updated",
        icon: "success",
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message,
        icon: "error",
        background: "#141E33",
        color: "#ffffff",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTwoFactor = async () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    try {
      await settingsApi.updateTwoFactor(next);
    } catch (err) {
      alert(err.message);
      setTwoFactorEnabled(!next); // revert on failure
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Profile, preferences and account security" />
        <p className="text-sm text-[#8B96AE]">Loading settings...</p>
      </div>
    );
  }

  function Toggle({ checked, onChange, label }) {
    return (
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex items-center rounded-full transition-colors duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141E33]
        ${checked ? "bg-blue-600" : "bg-[#1E2A45] hover:bg-[#293656]"}`}
        style={{ height: 24, width: 44, padding: 3 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-white transition-transform duration-200 ease-out"
          style={{
            height: 18,
            width: 18,
            transform: checked ? "translateX(20px)" : "translateX(0px)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          <svg
            viewBox="0 0 12 12"
            className={`transition-opacity duration-150 ${checked ? "opacity-100" : "opacity-0"}`}
            style={{ height: 9, width: 9 }}
          >
            <path
              d="M2 6.2L4.6 9L10 3"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Settings" subtitle="Profile, preferences and account security" />
      <div className="flex gap-1 mb-5 border-b border-[#1E2A45]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-500 text-[#E7ECF6]" : "border-transparent text-[#8B96AE] hover:text-[#E7ECF6]"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}

      <Card className="p-6 max-w-xl">
        {tab === "profile" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8B96AE] mb-1 block">Full Name</label>
              <input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-[#8B96AE] mb-1 block">Email</label>
              <input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-[#8B96AE] mb-1 block">Address</label>
              <input
                placeholder="Street, city, state"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {tab === "preferences" && (
          <div className="space-y-4">
            {/* {[
              { key: "notifications_email", label: "Email notifications" },
              { key: "notifications_sms", label: "SMS notifications" },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between py-2 border-b border-[#1E2A45] last:border-0">
                <span className="text-sm text-[#D7DEEB]">{p.label}</span>
                <button
                  onClick={() => togglePreference(p.key)}
                  className={`relative transition-colors ${preferences[p.key] ? "bg-blue-600" : "bg-[#1E2A45]"}`}
                  style={{ height: 22, width: 40, borderRadius: 9999 }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white transition-transform"
                    style={{
                      height: 18,
                      width: 18,
                      transform: preferences[p.key] ? "translateX(19px)" : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
            ))} */}
            {[
              { key: "notifications_email", label: "Email notifications" },
              { key: "notifications_sms", label: "SMS notifications" },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between py-3 border-b border-[#1E2A45] last:border-0">
                <span className="text-sm text-[#D7DEEB]">{p.label}</span>
                <Toggle
                  checked={preferences[p.key]}
                  onChange={() => togglePreference(p.key)}
                  label={p.label}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8B96AE] mb-1 block">Current Password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-[#8B96AE] mb-1 block">New Password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#D7DEEB]">Two-factor authentication</span>
              <button onClick={toggleTwoFactor}>
                <Badge tone={twoFactorEnabled ? "good" : "warn"}>{twoFactorEnabled ? "Enabled" : "Disabled"}</Badge>
              </button>
            </div>
            <button
              onClick={savePassword}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {saving ? "Updating..." : "Update Security"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Settings;

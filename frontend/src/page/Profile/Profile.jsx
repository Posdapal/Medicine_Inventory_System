/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Activity, AtSign, Camera, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import defaultAvatar from "../../assets/default-avatar.svg";
import { authApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";

const MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const photoKeyFor = (userId) => `medicine_inventory_profile_photo_${userId || "current"}`;

const normalizeProfile = (user = {}) => ({
  ...user,
  full_name: user.full_name || user.fullName || "",
  username: user.username || "",
  email: user.email || "",
  role: user.role || "",
  status: user.status || "",
});

function roleAppearance(role = "") {
  const value = String(role).toLowerCase();
  if (value.includes("admin") || value.includes("owner")) return { label: "Administrator", avatar: "bg-teal-50 text-teal-600 ring-teal-100", badge: "bg-teal-50 text-teal-700 ring-teal-200" };
  if (value.includes("pharmacist")) return { label: "Pharmacist", avatar: "bg-emerald-50 text-emerald-600 ring-emerald-100", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (value.includes("stock")) return { label: "Stock Staff", avatar: "bg-orange-100 text-orange-700 ring-orange-200", badge: "bg-orange-50 text-orange-700 ring-orange-200" };
  return { label: role || "Stock Staff", avatar: "bg-slate-100 text-slate-500 ring-slate-200", badge: "bg-slate-100 text-slate-600 ring-slate-200" };
}

function InformationItem({ icon: Icon, label, value, valueClass = "text-slate-900" }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"><Icon size={14} className="text-teal-600" aria-hidden="true" />{label}</div>
      <p className={`mt-2 truncate text-sm font-semibold ${valueClass}`}>{value || "—"}</p>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const imageInputRef = useRef(null);
  const [profile, setProfile] = useState(() => user ? normalizeProfile(user) : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const photoStorageKey = photoKeyFor(user?.id);
  const [photo, setPhoto] = useState(() => user?.profileImage || localStorage.getItem(photoStorageKey) || "");

  useEffect(() => {
    setPhoto(user?.profileImage || localStorage.getItem(photoStorageKey) || "");
  }, [user?.profileImage, photoStorageKey]);

  useEffect(() => {
    let mounted = true;
    authApi.profile().then((response) => {
      if (mounted) setProfile((current) => ({ ...current, ...normalizeProfile(response?.data ?? response) }));
    }).catch((requestError) => {
      if (mounted) setError(requestError.message || "Profile could not be loaded.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const role = roleAppearance(profile?.role);
  const status = String(profile?.status).trim().toLowerCase();
  const active = status === "active";
  const statusStyle = active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "inactive" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-slate-100 text-slate-600 ring-slate-200";
  const dotStyle = active ? "bg-emerald-500" : status === "inactive" ? "bg-rose-500" : "bg-slate-400";

  const selectImage = (file) => {
    setImageError("");
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setImageError("Image size must be 2MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imageData = String(reader.result);
        localStorage.setItem(photoStorageKey, imageData);
        setPhoto(imageData);
        updateUser({ profileImage: imageData });
        toast.success("Profile photo updated successfully.");
      } catch {
        setImageError("The image could not be saved. Please try a smaller image.");
      }
    };
    reader.onerror = () => setImageError("The image could not be read. Please try another file.");
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    localStorage.removeItem(photoStorageKey);
    setPhoto("");
    updateUser({ profileImage: "" });
    setImageError("");
  };

  return (
    <div className="w-full space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6 lg:p-8">
      <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Account</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">User Profile</h1><p className="mt-1 text-sm text-slate-500">Manage your photo and review your account information.</p></header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading && !profile ? <div className="space-y-5 animate-pulse"><div className="h-44 rounded-2xl bg-white" /><div className="h-64 rounded-2xl bg-white" /></div> : profile && <>
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex w-[180px] shrink-0 flex-col items-center justify-center py-2">
              <div className="relative mb-5 aspect-square h-24 w-24 min-h-24 min-w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-md shadow-slate-300/70 ring-1 ring-slate-200">
                <img src={photo || defaultAvatar} alt={photo ? `${profile.username || "User"} profile` : "Default user profile"} className={`h-full w-full object-cover object-center ${photo ? "scale-110" : ""}`} />
              </div>
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(event) => { selectImage(event.target.files?.[0]); event.target.value = ""; }} />
              <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex h-10 min-w-[156px] items-center justify-center gap-2 rounded-lg border border-[#0F9D8A] bg-white px-6 text-sm font-semibold text-[#0F9D8A] shadow-sm transition-colors hover:bg-[#EAF8F5]"><Camera size={16} />{photo ? "Change Image" : "Upload Image"}</button>
              {photo && <button type="button" onClick={removeImage} className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"><Trash2 size={14} />Remove Image</button>}
              {imageError && <p role="alert" className="mt-2 max-w-56 text-center text-xs font-medium text-rose-600">{imageError}</p>}
            </div>
            <div className="min-w-0 sm:pt-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Profile information</p><h2 className="mt-1 truncate text-2xl font-bold text-slate-900">{profile.username || "Unnamed user"}</h2><div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${role.badge}`}>{role.label}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle}`}><span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} />{profile.status || "Unknown"}</span></div></div>
          </div>
          <div className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center sm:w-auto sm:text-right"><p className="text-xs font-medium text-slate-500">User ID</p><p className="mt-1 font-mono text-sm font-semibold text-slate-700">#{profile.id}</p></div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
          <div className="border-b border-slate-100 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">User information</p><h2 className="mt-1 text-lg font-bold text-slate-900">Your account details</h2><p className="mt-1 text-sm text-slate-500">Personal information and access assigned to your account.</p></div>
          <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3"><InformationItem icon={UserRound} label="Name" value={profile.full_name} /><InformationItem icon={AtSign} label="Username" value={profile.username} /><InformationItem icon={Mail} label="Email" value={profile.email} /><InformationItem icon={ShieldCheck} label="Role" value={profile.role} /><InformationItem icon={Activity} label="Status" value={profile.status} valueClass={active ? "text-emerald-700" : "text-slate-700"} /></div>
        </section>
      </>}
    </div>
  );
}

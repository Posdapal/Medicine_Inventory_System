/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, KeyRound, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeCotext } from "../../context/ThemeContextProvider";
import defaultAvatar from "../../assets/default-avatar.svg";

const Navbar = ({ onLogout }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeCotext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Normalize role so casing/naming differences ("Administrator", "admin", etc.) don't break the check
  const roleName = user?.role || "Stock Staff";
  const isAdmin = roleName.toLowerCase() === "administrator" || roleName.toLowerCase() === "admin";

  const welcomeLabel = isAdmin ? "Welcome back, Admin" : "Welcome back";
  const displayRole = isAdmin ? "Administrator" : roleName;
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-400/80">
          {welcomeLabel},
        </p>
        <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-100">
          {user?.full_name || "Pharmacy User"} <span aria-hidden="true">👋</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-teal-300"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-teal-300">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-slate-900" />
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1.5 pr-2.5 transition hover:border-slate-700">
            <img src={user?.profileImage || defaultAvatar} alt="User profile" className="h-10 w-10 shrink-0 rounded-full object-cover object-center transition-opacity duration-200" />
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-slate-200">{user?.full_name || "Pharmacy User"}</span>
              <span className="block text-[10px] text-slate-500">{displayRole}</span>
            </span>
            <ChevronDown size={14} className={`text-slate-500 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl shadow-black/40">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-teal-300"
              >
                <UserRound size={15} /> Profile
              </Link>
              <Link
                to="/change-password"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-teal-300"
              >
                <KeyRound size={15} /> Change Password
              </Link>
              <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-400/10">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

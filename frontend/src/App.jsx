import './App.css'
import React, { useState } from "react";
import Dashboard from './components/Dashboard/Dashboard'
import Navbar from './components/Navbar/Navbar'
import Patients from './page/Patients/Patients'
import Sidebar from './components/Sidebar/Sidebar'
import ThemeContextProvider from './context/ThemeContextProvider'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Medicines from './page/Medicines/Medicines'
import Suppliers from './page/Suppliers/Suppliers'
import Categories from './page/Categories/Categories'
import Prescriptions from './page/Prescriptions/Prescriptions'
import Reports from './page/Reports/Reports'
import Users from './page/Users/Users'
import Settings from './page/Settings/Settings'
import Products from './page/Products/Products'
import RegisterLogin from './Authentication/RegisterLogin'
import { LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from "./context/AuthContext";
import Swal from "sweetalert2";

import {
  LayoutDashboard, Users as UsersIcon, Pill, Truck, Tags, Package, FileText,
  BarChart3, UserCog, Settings as SettingsIcon, Stethoscope
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: Dashboard },
  { key: "patients", label: "Patients", icon: UsersIcon, Component: Patients },
  { key: "medicines", label: "Medicines", icon: Pill, Component: Medicines },
  { key: "suppliers", label: "Suppliers", icon: Truck, Component: Suppliers },
  { key: "categories", label: "Categories", icon: Tags, Component: Categories },
  { key: "products", label: "Products", icon: Package, Component: Products },
  { key: "prescriptions", label: "Prescriptions", icon: FileText, Component: Prescriptions },
  { key: "reports", label: "Reports", icon: BarChart3, Component: Reports },
  { key: "users", label: "User Management", icon: UserCog, Component: Users },
];

function Shell() {
  const { isAuthenticated, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!isAuthenticated) {
    return <RegisterLogin onLogin={() => setPage("dashboard")} />;
  }

  const active = page === "settings" ? { Component: Settings } : NAV.find((n) => n.key === page) || NAV[0];
  const ActivePage = active.Component;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Log out?",
      text: "You'll need to sign in again to access the dashboard.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Log out",
      cancelButtonText: "Stay signed in",
      confirmButtonColor: "#dc2626",
      background: "#141E33",
      color: "#ffffff",
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-[#E7ECF6]">
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-[#1E2A45] flex flex-col">
        <div className="h-16 flex items-center px-6 font-semibold border-b border-gray-200 dark:border-[#1E2A45]">
          <div className="flex items-center gap-4 justify-center mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <span className="text-xl font-semibold text-[#E7ECF6] tracking-tight">Clinic ERP</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-500 dark:text-[#8B96AE] hover:bg-black/5 dark:hover:bg-white/[0.04]"
                  }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200 dark:border-[#1E2A45] space-y-1">
          <button
            onClick={() => setPage("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${page === "settings"
              ? "bg-blue-600 text-white font-medium"
              : "text-gray-500 dark:text-[#8B96AE] hover:bg-black/5 dark:hover:bg-white/[0.04]"
              }`}
          >
            <SettingsIcon size={17} /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-[#8B96AE] hover:text-rose-500"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <ActivePage />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeContextProvider>
  );
}

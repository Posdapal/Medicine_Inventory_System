// import './App.css'
// import React, { useState } from "react";
// import Dashboard from './components/Dashboard/Dashboard'
// import Navbar from './components/Navbar/Navbar'
// import Patients from './page/Patients/Patients'
// import Sidebar from './components/Sidebar/Sidebar'
// import ThemeContextProvider from './context/ThemeContextProvider'
// import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import Medicines from './page/Medicines/Medicines'
// import Suppliers from './page/Suppliers/Suppliers'
// import Categories from './page/Categories/Categories'
// import Prescriptions from './page/Prescriptions/Prescriptions'
// import Reports from './page/Reports/Reports'
// import Users from './page/Users/Users'
// import Settings from './page/Settings/Settings'
// import Products from './page/Products/Products'
// import RegisterLogin from './Authentication/RegisterLogin'
// import { LogOut } from 'lucide-react'
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import Swal from "sweetalert2";

// import {
//   LayoutDashboard, Users as UsersIcon, Pill, Truck, Tags, Package, FileText,
//   BarChart3, UserCog, Settings as SettingsIcon, Stethoscope
// } from "lucide-react";

// const NAV = [
//   { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: Dashboard },
//   { key: "patients", label: "Patients", icon: UsersIcon, Component: Patients },
//   { key: "medicines", label: "Medicines", icon: Pill, Component: Medicines },
//   { key: "suppliers", label: "Suppliers", icon: Truck, Component: Suppliers },
//   { key: "categories", label: "Categories", icon: Tags, Component: Categories },
//   { key: "products", label: "Products", icon: Package, Component: Products },
//   { key: "prescriptions", label: "Prescriptions", icon: FileText, Component: Prescriptions },
//   { key: "reports", label: "Reports", icon: BarChart3, Component: Reports },
//   { key: "users", label: "User Management", icon: UserCog, Component: Users },
// ];

// function Shell() {
//   const { isAuthenticated, logout } = useAuth();
//   const [page, setPage] = useState("dashboard");

//   if (!isAuthenticated) {
//     return <RegisterLogin onLogin={() => setPage("dashboard")} />;
//   }

//   const active = page === "settings" ? { Component: Settings } : NAV.find((n) => n.key === page) || NAV[0];
//   const ActivePage = active.Component;

//   const handleLogout = async () => {
//     const result = await Swal.fire({
//       title: "Log out?",
//       text: "You'll need to sign in again to access the dashboard.",
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Log out",
//       cancelButtonText: "Stay signed in",
//       confirmButtonColor: "#dc2626",
//       background: "#141E33",
//       color: "#ffffff",
//     });

//     if (result.isConfirmed) {
//       logout();
//     }
//   };

//   return (
//     <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-[#E7ECF6]">
//       <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-[#1E2A45] flex flex-col">
//         <div className="h-16 flex items-center px-6 font-semibold border-b border-gray-200 dark:border-[#1E2A45]">
//           <div className="flex items-center gap-4 justify-center mb-1">
//             <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
//               <Stethoscope size={18} className="text-white" />
//             </div>
//             <span className="text-xl font-semibold text-[#E7ECF6] tracking-tight">Clinic ERP</span>
//           </div>
//         </div>
//         <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//           {NAV.map((item) => {
//             const Icon = item.icon;
//             const isActive = page === item.key;
//             return (
//               <button
//                 key={item.key}
//                 onClick={() => setPage(item.key)}
//                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
//                   ? "bg-blue-600 text-white font-medium"
//                   : "text-gray-500 dark:text-[#8B96AE] hover:bg-black/5 dark:hover:bg-white/[0.04]"
//                   }`}
//               >
//                 <Icon size={17} />
//                 {item.label}
//               </button>
//             );
//           })}
//         </nav>
//         <div className="px-3 py-4 border-t border-gray-200 dark:border-[#1E2A45] space-y-1">
//           <button
//             onClick={() => setPage("settings")}
//             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${page === "settings"
//               ? "bg-blue-600 text-white font-medium"
//               : "text-gray-500 dark:text-[#8B96AE] hover:bg-black/5 dark:hover:bg-white/[0.04]"
//               }`}
//           >
//             <SettingsIcon size={17} /> Settings
//           </button>
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-[#8B96AE] hover:text-rose-500"
//           >
//             <LogOut size={17} /> Log out
//           </button>
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col min-w-0">
//         <Navbar />
//         <main className="flex-1 overflow-y-auto">
//           <ActivePage />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <ThemeContextProvider>
//       <AuthProvider>
//         <Shell />
//       </AuthProvider>
//     </ThemeContextProvider>
//   );
// }


// App.jsx
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  LayoutDashboard, Package, Truck, Boxes, AlertTriangle, BarChart3,
  Settings as SettingsIcon, LogOut, ChevronDown, ChevronRight, Cross,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ThemeContextProvider from "./context/ThemeContextProvider";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard/Dashboard";
import Products from "./page/Products/Products";
import Categories from "./page/Categories/Categories";
import Units from "./page/Units/Units";
import Suppliers from "./page/Suppliers/Suppliers";
import StockIn from "./page/StockIn/StockIn";
import StockOut from "./page/StockOut/StockOut";
import CurrentStock from "./page/CurrentStock/CurrentStock";
import StockHistory from "./page/StockHistory/StockHistory";
import NearExpiry from "./page/NearExpiry/NearExpiry";
import ExpiredProducts from "./page/ExpiredProducts/ExpiredProducts";
import Reports from "./page/Reports/Reports";
import Settings from "./page/Settings/Settings";
import Navbar from "./components/Navbar/Navbar";
import { SidebarItem } from "./components/ui/Primitives";

// Sidebar structure mirrors: Dashboard / Products / Suppliers /
// Stock Management / Expiry Management / Reports
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: Dashboard },
  {
    key: "products", label: "Products", icon: Package,
    children: [
      { key: "product-list", label: "Product List", Component: Products },
      { key: "categories", label: "Categories", Component: Categories },
      { key: "units", label: "Units", Component: Units },
    ],
  },
  {
    key: "suppliers", label: "Suppliers", icon: Truck,
    children: [
      { key: "supplier-list", label: "Supplier List", Component: Suppliers },
    ],
  },
  {
    key: "stock-management", label: "Stock Management", icon: Boxes,
    children: [
      { key: "stock-in", label: "Stock In", Component: StockIn },
      { key: "stock-out", label: "Stock Out", Component: StockOut },
      { key: "current-stock", label: "Current Stock", Component: CurrentStock },
      { key: "stock-history", label: "Stock History", Component: StockHistory },
    ],
  },
  {
    key: "expiry-management", label: "Expiry Management", icon: AlertTriangle,
    children: [
      { key: "near-expiry", label: "Near Expiry", Component: NearExpiry },
      { key: "expired-products", label: "Expired Products", Component: ExpiredProducts },
    ],
  },
  { key: "reports", label: "Reports", icon: BarChart3, Component: Reports },
];

// Flatten for quick lookup of the active page's component
function findActive(page) {
  for (const item of NAV) {
    if (item.key === page) return item;
    if (item.children) {
      const child = item.children.find((c) => c.key === page);
      if (child) return child;
    }
  }
  return null;
}

// Which top-level group (if any) contains a given page key
function parentGroupOf(page) {
  const group = NAV.find((item) => item.children?.some((c) => c.key === page));
  return group?.key;
}

function DashboardShell() {
  const { logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [openGroups, setOpenGroups] = useState(() => new Set([parentGroupOf("dashboard")].filter(Boolean)));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const active = page === "settings" ? { Component: Settings } : findActive(page) || NAV[0];
  const ActivePage = active.Component;

  const toggleGroup = (key) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setOpenGroups((prev) => new Set(prev).add(key));
      return;
    }

    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectPage = (key, groupKey) => {
    setPage(key);
    if (groupKey) {
      setOpenGroups((prev) => new Set(prev).add(groupKey));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/20 backdrop-blur-xl transition-[width] duration-300 ${sidebarCollapsed ? "w-24" : "w-[248px]"}`}>
        <div className={`flex h-[72px] items-center gap-2 border-b border-slate-800/80 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 shadow-lg shadow-teal-950/50">
            <Cross size={21} strokeWidth={2.5} />
          </div>
          <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-bold leading-tight tracking-tight text-slate-100">Medicine Inventory</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-400/70">System</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Main menu</div>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const Icon = item.icon;

            // Leaf (no children) — e.g. Dashboard, Reports
            if (!item.children) {
              const isActive = page === item.key;
              return (
                <SidebarItem
                  key={item.key}
                  onClick={() => selectPage(item.key)}
                  icon={Icon}
                  label={item.label}
                  active={isActive}
                  collapsed={sidebarCollapsed}
                  title={sidebarCollapsed ? item.label : undefined}
                />
              );
            }

            // Group with children — collapsible section
            const isOpen = openGroups.has(item.key);
            const groupHasActiveChild = item.children.some((c) => c.key === page);
            return (
              <div key={item.key}>
                <SidebarItem
                  onClick={() => toggleGroup(item.key)}
                  icon={Icon}
                  label={item.label}
                  active={groupHasActiveChild}
                  collapsed={sidebarCollapsed}
                  title={sidebarCollapsed ? item.label : undefined}
                  suffix={isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                />
                {isOpen && !sidebarCollapsed && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-slate-800 pl-2">
                    {item.children.map((child) => {
                      const isActive = page === child.key;
                      return (
                        <SidebarItem
                          key={child.key}
                          onClick={() => selectPage(child.key, item.key)}
                          label={child.label}
                          active={isActive}
                          nested
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-slate-800/80 p-3">
          <SidebarItem
            onClick={() => setPage("settings")}
            icon={SettingsIcon}
            label="Settings"
            active={page === "settings"}
            collapsed={sidebarCollapsed}
            title={sidebarCollapsed ? "Settings" : undefined}
          />
          <SidebarItem
            onClick={logout}
            icon={LogOut}
            label="Logout"
            collapsed={sidebarCollapsed}
            title={sidebarCollapsed ? "Logout" : undefined}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onLogout={logout} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.055),transparent_34%)]">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <ActivePage />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute requirePasswordChange />}>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/*" element={<DashboardShell />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeContextProvider>
  );
}


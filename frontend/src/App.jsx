import { useEffect, useState } from "react";

import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Truck,
  Boxes,
  AlertTriangle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  ChevronRight,
  Cross,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
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
import Users from "./page/Users/Users";
import Settings from "./page/Settings/Settings";

import Navbar from "./components/Navbar/Navbar";
import { SidebarItem } from "./components/ui/Primitives";


// =====================================================
// SIDEBAR NAVIGATION
// =====================================================

const NAV = [

  // ===================================================
  // DASHBOARD
  // ===================================================

  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    Component: Dashboard,
  },


  // ===================================================
  // PRODUCTS
  // ===================================================

  {
    key: "products",
    label: "Products",
    icon: Package,

    children: [

      {
        key: "product-list",
        label: "Product List",
        path: "/dashboard/products",
        Component: Products,
      },

      {
        key: "categories",
        label: "Categories",
        path: "/dashboard/categories",
        Component: Categories,
      },

      {
        key: "units",
        label: "Units",
        path: "/dashboard/units",
        Component: Units,
      },

    ],
  },


  // ===================================================
  // SUPPLIERS
  // ===================================================

  {
    key: "suppliers",
    label: "Suppliers",
    icon: Truck,
    path: "/dashboard/suppliers",
    Component: Suppliers,
  },


  // ===================================================
  // STOCK MANAGEMENT
  // ===================================================

  {
    key: "stock-management",
    label: "Stock Management",
    icon: Boxes,

    children: [

      {
        key: "stock-in",
        label: "Stock In",
        path: "/dashboard/stock-in",
        Component: StockIn,
      },

      {
        key: "stock-out",
        label: "Stock Out",
        path: "/dashboard/stock-out",
        Component: StockOut,
      },

      {
        key: "current-stock",
        label: "Current Stock",
        path: "/dashboard/current-stock",
        Component: CurrentStock,
      },

      {
        key: "stock-history",
        label: "Stock History",
        path: "/dashboard/stock-history",
        Component: StockHistory,
      },

    ],
  },


  // ===================================================
  // EXPIRY MANAGEMENT
  // ===================================================

  {
    key: "expiry-management",
    label: "Expiry Management",
    icon: AlertTriangle,

    children: [

      {
        key: "near-expiry",
        label: "Near Expiry",
        path: "/dashboard/near-expiry",
        Component: NearExpiry,
      },

      {
        key: "expired-products",
        label: "Expired Products",
        path: "/dashboard/expired-products",
        Component: ExpiredProducts,
      },

    ],
  },


  // ===================================================
  // REPORTS
  // ===================================================

  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    path: "/dashboard/reports",
    Component: Reports,
  },


  // ===================================================
  // USERS
  // ===================================================

  {
    key: "users",
    label: "Users",
    icon: UserCog,
    path: "/dashboard/users",
    Component: Users,
  },

];


// =====================================================
// FIND PAGE BY URL
// =====================================================

function findPageByPath(pathname) {

  // ---------------------------------------------------
  // Dashboard
  // ---------------------------------------------------

  if (pathname === "/dashboard") {

    return {
      key: "dashboard",
      Component: Dashboard,
    };

  }


  // ---------------------------------------------------
  // Search NAV
  // ---------------------------------------------------

  for (const item of NAV) {

    // -------------------------------------------------
    // Top-level page
    // -------------------------------------------------

    if (item.path === pathname) {

      return {
        key: item.key,
        Component: item.Component,
      };

    }


    // -------------------------------------------------
    // Nested page
    // -------------------------------------------------

    if (item.children) {

      const child = item.children.find(
        (child) =>
          child.path === pathname
      );

      if (child) {

        return {
          key: child.key,
          Component: child.Component,
          parentKey: item.key,
        };

      }

    }

  }


  // ---------------------------------------------------
  // Settings
  // ---------------------------------------------------

  if (pathname === "/dashboard/settings") {

    return {
      key: "settings",
      Component: Settings,
    };

  }


  // ---------------------------------------------------
  // Default
  // ---------------------------------------------------

  return {
    key: "dashboard",
    Component: Dashboard,
  };

}


// =====================================================
// FIND PARENT GROUP
// =====================================================

function parentGroupOf(pageKey) {

  const group = NAV.find(
    (item) =>
      item.children?.some(
        (child) =>
          child.key === pageKey
      )
  );

  return group?.key;

}


// =====================================================
// DASHBOARD SHELL
// =====================================================

function DashboardShell() {

  const { logout } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();


  // ===================================================
  // SIDEBAR STATE
  // ===================================================

  const [openGroups, setOpenGroups] =
    useState(new Set());

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);


  // ===================================================
  // CURRENT PAGE
  // ===================================================

  const active = findPageByPath(
    location.pathname
  );

  const page = active.key;

  const ActivePage = active.Component;


  // ===================================================
  // AUTOMATICALLY OPEN PARENT GROUP
  //
  // This only opens the parent.
  //
  // It DOES NOT select the parent.
  //
  // ===================================================

  useEffect(() => {

    const parentKey =
      parentGroupOf(page);

    if (!parentKey) {
      return;
    }

    setOpenGroups((prev) => {

      const next = new Set(prev);

      next.add(parentKey);

      return next;

    });

  }, [page]);


  // ===================================================
  // TOGGLE GROUP
  //
  // Clicking Products / Stock Management /
  // Expiry Management ONLY opens or closes.
  //
  // It does NOT navigate.
  //
  // ===================================================

  const toggleGroup = (key) => {

    // -------------------------------------------------
    // If sidebar is collapsed
    // -------------------------------------------------

    if (sidebarCollapsed) {

      setSidebarCollapsed(false);

      setOpenGroups((prev) => {

        const next = new Set(prev);

        next.add(key);

        return next;

      });

      return;
    }


    // -------------------------------------------------
    // Normal open / close
    // -------------------------------------------------

    setOpenGroups((prev) => {

      const next = new Set(prev);

      if (next.has(key)) {

        next.delete(key);

      } else {

        next.add(key);

      }

      return next;

    });

  };


  // ===================================================
  // SELECT PAGE
  //
  // This is ONLY used for actual pages.
  //
  // Example:
  //
  // Product List -> /dashboard/products
  // Categories   -> /dashboard/categories
  // Units        -> /dashboard/units
  //
  // ===================================================

  const selectPage = (item, groupKey = null) => {

    // -------------------------------------------------
    // If this is a nested page,
    // keep its parent group open.
    // -------------------------------------------------

    if (groupKey) {

      setOpenGroups((prev) => {

        const next = new Set(prev);

        next.add(groupKey);

        return next;

      });

    }


    // -------------------------------------------------
    // Navigate ONLY to clicked item
    // -------------------------------------------------

    if (item.path) {

      navigate(item.path);

    }

  };


  // ===================================================
  // SELECT GROUP
  //
  // IMPORTANT:
  //
  // This NEVER calls navigate().
  //
  // Products:
  //     click -> open/close only
  //
  // ===================================================

  const selectGroup = (item) => {

    toggleGroup(item.key);

  };


  // ===================================================
  // SETTINGS
  // ===================================================

  const goToSettings = () => {

    navigate("/dashboard/settings");

  };


  // ===================================================
  // UI
  // ===================================================

  return (

    <div
      className="
        flex
        min-h-screen
        bg-slate-950
        text-slate-100
      "
    >

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          sticky
          top-0
          flex
          h-screen
          shrink-0
          flex-col
          border-r
          border-slate-800/80
          bg-slate-900/70
          shadow-2xl
          shadow-black/20
          backdrop-blur-xl
          transition-[width]
          duration-300

          ${
            sidebarCollapsed
              ? "w-24"
              : "w-[248px]"
          }
        `}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div
          className={`
            flex
            h-[72px]
            items-center
            gap-2
            border-b
            border-slate-800/80

            ${
              sidebarCollapsed
                ? "justify-center px-2"
                : "px-5"
            }
          `}
        >

          {/* Logo */}

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-teal-400
              to-cyan-600
              text-slate-950
              shadow-lg
              shadow-teal-950/50
            "
          >

            <Cross
              size={21}
              strokeWidth={2.5}
            />

          </div>


          {/* System name */}

          <div
            className={`
              min-w-0
              flex-1

              ${
                sidebarCollapsed
                  ? "hidden"
                  : "block"
              }
            `}
          >

            <p
              className="
                truncate
                text-sm
                font-bold
                leading-tight
                tracking-tight
                text-slate-100
              "
            >
              Medicine Inventory
            </p>

            <p
              className="
                mt-1
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-teal-400/70
              "
            >
              System
            </p>

          </div>


          {/* Collapse button */}

          <button
            type="button"

            onClick={() =>
              setSidebarCollapsed(
                (collapsed) =>
                  !collapsed
              )
            }

            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-500
              transition
              hover:bg-white/[0.06]
              hover:text-slate-200
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-teal-400
            "

            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }

            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >

            {sidebarCollapsed ? (

              <PanelLeftOpen
                size={18}
              />

            ) : (

              <PanelLeftClose
                size={18}
              />

            )}

          </button>

        </div>


        {/* =================================================
            MAIN MENU TITLE
        ================================================= */}

        {!sidebarCollapsed && (

          <div
            className="
              px-4
              pb-2
              pt-5
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-slate-600
            "
          >
            Main menu
          </div>

        )}


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="
            flex-1
            space-y-1
            overflow-y-auto
            px-3
            pb-4
          "
        >

          {NAV.map((item) => {

            const Icon = item.icon;


            // =================================================
            // NORMAL / TOP-LEVEL ITEM
            //
            // Dashboard
            // Suppliers
            // Reports
            // Users
            // =================================================

            if (!item.children) {

              const isActive =
                location.pathname ===
                item.path;


              return (

                <SidebarItem
                  key={item.key}

                  onClick={() =>
                    selectPage(item)
                  }

                  icon={Icon}

                  label={item.label}

                  active={isActive}

                  collapsed={
                    sidebarCollapsed
                  }

                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                />

              );

            }


            // =================================================
            // GROUP
            //
            // Products
            // Stock Management
            // Expiry Management
            // =================================================

            const isOpen =
              openGroups.has(
                item.key
              );


            // =================================================
            // IMPORTANT
            //
            // Parent group is NEVER selected.
            //
            // Even when:
            //
            // Products
            //    Product List <- selected
            //
            // "Products" itself remains unselected.
            //
            // =================================================

            const groupIsActive = false;


            return (

              <div
                key={item.key}
              >

                {/* =================================================
                    PARENT GROUP
                ================================================= */}

                <SidebarItem
                  onClick={() =>
                    selectGroup(item)
                  }

                  icon={Icon}

                  label={item.label}

                  /*
                   * IMPORTANT:
                   *
                   * Parent is never active.
                   */
                  active={
                    groupIsActive
                  }

                  collapsed={
                    sidebarCollapsed
                  }

                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }

                  suffix={
                    sidebarCollapsed
                      ? null
                      : isOpen ? (

                          <ChevronDown
                            size={15}
                          />

                        ) : (

                          <ChevronRight
                            size={15}
                          />

                        )
                  }
                />


                {/* =================================================
                    NESTED CHILDREN
                ================================================= */}

                {isOpen &&
                  !sidebarCollapsed && (

                    <div
                      className="
                        ml-5
                        mt-1
                        space-y-1
                        border-l
                        border-slate-800
                        pl-2
                      "
                    >

                      {item.children.map(
                        (child) => {

                          // =================================================
                          // ONLY THE CURRENT URL IS ACTIVE
                          //
                          // Example:
                          //
                          // /dashboard/products
                          //
                          // Product List = true
                          // Categories   = false
                          // Units        = false
                          //
                          // =================================================

                          const isActive =
                            location.pathname ===
                            child.path;


                          return (

                            <SidebarItem
                              key={
                                child.key
                              }

                              onClick={() =>
                                selectPage(
                                  child,
                                  item.key
                                )
                              }

                              label={
                                child.label
                              }

                              /*
                               * Only the clicked/current
                               * child becomes active.
                               */
                              active={
                                isActive
                              }

                              nested
                            />

                          );

                        }
                      )}

                    </div>

                  )}

              </div>

            );

          })}

        </nav>


        {/* =================================================
            BOTTOM SIDEBAR
        ================================================= */}

        <div
          className="
            space-y-1
            border-t
            border-slate-800/80
            p-3
          "
        >

          {/* =================================================
              SETTINGS
          ================================================= */}

          <SidebarItem
            onClick={
              goToSettings
            }

            icon={
              SettingsIcon
            }

            label="Settings"

            active={
              location.pathname ===
              "/dashboard/settings"
            }

            collapsed={
              sidebarCollapsed
            }

            title={
              sidebarCollapsed
                ? "Settings"
                : undefined
            }
          />


          {/* =================================================
              LOGOUT
          ================================================= */}

          <SidebarItem
            onClick={
              logout
            }

            icon={
              LogOut
            }

            label="Logout"

            collapsed={
              sidebarCollapsed
            }

            title={
              sidebarCollapsed
                ? "Logout"
                : undefined
            }
          />

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
        "
      >

        {/* =================================================
            NAVBAR
        ================================================= */}

        <Navbar
          onLogout={
            logout
          }
        />


        {/* =================================================
            CONTENT
        ================================================= */}

        <main
          className="
            min-w-0
            flex-1
            overflow-y-auto
            bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.055),transparent_34%)]
          "
        >

          <div
            className="
              w-full
              px-4
              py-6
              sm:px-6
              lg:px-8
            "
          >

            <ActivePage />

          </div>

        </main>

      </div>

    </div>

  );

}


// =====================================================
// APP
// =====================================================

export default function App() {

  return (

    <ThemeContextProvider>

      <AuthProvider>

        <Routes>

          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />


          {/* =================================================
              RESET PASSWORD
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                requirePasswordChange
              />
            }
          >

            <Route
              path="/reset-password"
              element={
                <ResetPassword />
              }
            />

          </Route>


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            element={
              <ProtectedRoute />
            }
          >

            <Route
              path="/dashboard/*"
              element={
                <DashboardShell />
              }
            />

          </Route>


          {/* =================================================
              UNKNOWN URL
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>

    </ThemeContextProvider>

  );

}
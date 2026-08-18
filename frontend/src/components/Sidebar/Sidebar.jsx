import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Pill, Truck, Tags, Package, FileText,
  BarChart3, UserCog, Settings as SettingsIcon, LogOut, Search,
  Bell, ChevronDown, Plus, Trash2, X, AlertTriangle, Lock, Mail,
  Eye, EyeOff, Stethoscope
} from "lucide-react";

import {
  FaTachometerAlt,
  FaUserInjured,
  FaCapsules,
  FaTruck,
  FaTags,
  FaFilePrescription,
  FaChartBar,
  FaPiedPiper,
  FaUsersCog,
  FaCog,
  FaProductHunt,
  FaUsersCog,
} from "react-icons/fa";
import { CiLogout } from "react-icons/ci";


const Sidebar = () => {


  const menuItems = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
      color: "text-blue-500",
    },

    {
      name: "Suppliers",
      path: "/suppliers",
      icon: <FaTruck />,
      color: "text-orange-500",
    },

    {
      name: "Categories",
      path: "/categories",
      icon: <FaTags />,
      color: "text-pink-500",
    },

    {
      name: "Products",
      path: "/products",
      icon: <FaProductHunt />,
      color: "text-pink-500",
    },

    {
      name: "Reports",
      path: "/reports",
      icon: <FaChartBar />,
      color: "text-indigo-500",
    },

    {
      name: "Users",
      path: "users",
      icon: <FaUsersCog/>,
      color: "text-yellow-500",
    },

    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
      color: "text-gray-500",
    },

    {
      name: "Logout",
      path: "/logout",
      icon: <CiLogout />,
      color: "text-gray-500",
    }

  ];



  return (

    <aside
      className="
      fixed
      top-0
      left-0
      h-screen
      w-16
      md:w-64
      bg-white
      dark:bg-gray-900
      text-gray-800
      dark:text-white
      border-r
      border-gray-300
      dark:border-gray-700
      transition-all
      duration-300
      px-3
      "
    >



      {/* Logo */}

       <div className="flex items-center gap-2 px-6 h-16 border-b border-[#1E2A45]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight">Medicine Inventory System</span>
        </div>





      {/* Menu */}

      <nav
        className="
        mt-8
        flex
        flex-col
        gap-2
        "
      >


        {
          menuItems.map((item, index) => (


            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center w-full gap-4 px-3 py-3 rounded-xl transition-all duration-300
    ${isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-600 hover:text-white"
                }`
              }
            >
              <span
                className={`text-xl flex-shrink-0 ${item.color} group-hover:text-white`}
              >
                {item.icon}
              </span>

              <span className="hidden md:inline text-sm font-semibold">
                {item.name}
              </span>
            </NavLink>


          ))
        }



      </nav>



    </aside>

  );

};


export default Sidebar;

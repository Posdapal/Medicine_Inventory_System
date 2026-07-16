import React, { useContext } from "react";
import { ThemeCotext } from "../../context/ThemeContextProvider";
import { ChevronDown, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeCotext);
  const { user } = useAuth();

  return (
    <div className="bg-gray-100 text-gray-900 border-b border-gray-300 p-4 flex justify-between items-center dark:border-gray-600 dark:bg-gray-900 dark:text-white">
      <h1>Dashboard</h1>
      <div className="flex items-center gap-4">
        <button className="text-[#8B96AE] hover:text-[#E7ECF6]">
          <Bell size={17} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-[#1E2A45]">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>
          <span className="text-sm">{user?.full_name || "Admin User"}</span>
          <ChevronDown size={14} className="text-[#5D6B85]" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

// import React, { useEffect, useState } from "react";
// import Card from "../Card/Card";
// import { FaUserInjured, FaCapsules, FaTruck, FaExclamationTriangle } from "react-icons/fa";
// import { Line, Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   LineElement,
//   BarElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { dashboardApi } from "../../api/endpoints";

// ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// const Dashboard = () => {
//   const [summary, setSummary] = useState(null);
//   const [usage, setUsage] = useState([]);
//   const [stock, setStock] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let isMounted = true;

//     async function loadDashboard() {
//       setLoading(true);
//       setError("");
//       try {
//         const [summaryRes, usageRes, stockRes] = await Promise.all([
//           dashboardApi.summary(),
//           dashboardApi.usageChart(),
//           dashboardApi.stockChart(),
//         ]);
//         if (!isMounted) return;
//         setSummary(summaryRes.data);
//         setUsage(usageRes.data || []);
//         setStock(stockRes.data || []);
//       } catch (err) {
//         if (isMounted) setError(err.message);
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     }

//     loadDashboard();
//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   const dataLine = {
//     labels: usage.map((u) => u.usage_month),
//     datasets: [
//       {
//         label: "Medicine Usage",
//         data: usage.map((u) => u.total_used),
//         borderColor: "#2563eb",
//         backgroundColor: "rgba(37,99,235,0.2)",
//         pointBackgroundColor: "#2563eb",
//         fill: true,
//         tension: 0.4,
//       },
//     ],
//   };

//   const dataBar = {
//     labels: stock.map((s) => s.category),
//     datasets: [
//       {
//         label: "Stock",
//         data: stock.map((s) => s.total_stock),
//         backgroundColor: ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"],
//         borderRadius: 8,
//       },
//     ],
//   };

//   if (loading) {
//     return <div className="grow p-6 text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
//   }

//   if (error) {
//     return <div className="grow p-6 text-red-500">{error}</div>;
//   }

//   return (
//     <div className="grow p-6 space-y-6">
//       {/* Header */}
//       <div>
//         <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Clinic Dashboard</h2>
//         <p className="text-gray-500 dark:text-gray-400">Inventory and healthcare management overview</p>
//       </div>

//       {/* Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
//         <Card icon={<FaUserInjured />} title="Patients" value={summary?.total_patients ?? 0} color="blue" />
//         <Card icon={<FaCapsules />} title="Medicines" value={summary?.total_medicines ?? 0} color="green" />
//         <Card icon={<FaTruck />} title="Suppliers" value={summary?.total_suppliers ?? 0} color="purple" />
//         <Card icon={<FaExclamationTriangle />} title="Low Stock" value={summary?.low_stock_count ?? 0} color="red" />
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         {/* Line Chart */}
//         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
//           <h3 className="text-lg font-semibold mb-5 dark:text-white">Medicine Usage Report</h3>
//           {usage.length > 0 ? (
//             <Line data={dataLine} />
//           ) : (
//             <p className="text-sm text-gray-500 dark:text-gray-400">No usage data recorded yet.</p>
//           )}
//         </div>

//         {/* Bar Chart */}
//         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
//           <h3 className="text-lg font-semibold mb-5 dark:text-white">Medicine Stock Report</h3>
//           {stock.length > 0 ? (
//             <Bar data={dataBar} />
//           ) : (
//             <p className="text-sm text-gray-500 dark:text-gray-400">No stock data recorded yet.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Package, Boxes, AlertTriangle, XCircle,
  ArrowDownCircle, ArrowUpCircle, Clock, Ban,
  Truck, Tags, Users as UsersIcon,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
// import { dashboardApi } from "../api/endpoints";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StatCard({ icon: Icon, title, value, tone = "blue" }) {
  const tones = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    slate: "text-slate-300 bg-slate-500/10",
  };
  return (
    <div className="bg-[#141E33] border border-[#1E2A45] rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs text-[#8B96AE] font-medium">{title}</p>
        <p className="text-xl font-semibold text-[#E7ECF6]">{value}</p>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, chartRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.stockInOutChart(),
        ]);
        if (!isMounted) return;
        setSummary(summaryRes.data);
        setChart(chartRes.data || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const barData = {
    labels: chart.map((c) => c.month),
    datasets: [
      {
        label: "Stock In",
        data: chart.map((c) => c.stock_in),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
      {
        label: "Stock Out",
        data: chart.map((c) => c.stock_out),
        backgroundColor: "#f97316",
        borderRadius: 6,
      },
    ],
  };

  if (loading) {
    return <div className="grow p-6 text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="grow p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="grow p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">Dashboard</h2>
        <p className="text-sm text-[#8B96AE] mt-1">Inventory overview at a glance</p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} title="Total Products" value={summary?.total_products ?? 0} tone="blue" />
        <StatCard icon={Boxes} title="Total Stock" value={summary?.total_stock ?? 0} tone="green" />
        <StatCard icon={AlertTriangle} title="Low Stock" value={summary?.low_stock ?? 0} tone="amber" />
        <StatCard icon={XCircle} title="Out of Stock" value={summary?.out_of_stock ?? 0} tone="rose" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ArrowDownCircle} title="Stock In Today" value={summary?.stock_in_today ?? 0} tone="green" />
        <StatCard icon={ArrowUpCircle} title="Stock Out Today" value={summary?.stock_out_today ?? 0} tone="amber" />
        <StatCard icon={Clock} title="Near Expiry" value={summary?.near_expiry ?? 0} tone="amber" />
        <StatCard icon={Ban} title="Expired Products" value={summary?.expired_products ?? 0} tone="rose" />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Truck} title="Total Suppliers" value={summary?.total_suppliers ?? 0} tone="purple" />
        <StatCard icon={Tags} title="Total Categories" value={summary?.total_categories ?? 0} tone="blue" />
        <StatCard icon={UsersIcon} title="Total Users" value={summary?.total_users ?? 0} tone="slate" />
      </div>

      {/* Stock In and Stock Out Summary */}
      <div className="bg-[#141E33] border border-[#1E2A45] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#E7ECF6] mb-5">Stock In and Stock Out Summary</h3>
        {chart.length > 0 ? (
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom", labels: { color: "#8B96AE" } } },
              scales: {
                x: { ticks: { color: "#8B96AE" }, grid: { color: "#1E2A45" } },
                y: { ticks: { color: "#8B96AE" }, grid: { color: "#1E2A45" } },
              },
            }}
          />
        ) : (
          <p className="text-sm text-[#8B96AE]">No stock movement data recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


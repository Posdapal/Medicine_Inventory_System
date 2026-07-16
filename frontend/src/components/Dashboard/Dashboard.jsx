import React, { useEffect, useState } from "react";
import Card from "../Card/Card";
import { FaUserInjured, FaCapsules, FaTruck, FaExclamationTriangle } from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { dashboardApi } from "../../api/endpoints";

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [usage, setUsage] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, usageRes, stockRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.usageChart(),
          dashboardApi.stockChart(),
        ]);
        if (!isMounted) return;
        setSummary(summaryRes.data);
        setUsage(usageRes.data || []);
        setStock(stockRes.data || []);
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

  const dataLine = {
    labels: usage.map((u) => u.usage_month),
    datasets: [
      {
        label: "Medicine Usage",
        data: usage.map((u) => u.total_used),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        pointBackgroundColor: "#2563eb",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const dataBar = {
    labels: stock.map((s) => s.category),
    datasets: [
      {
        label: "Stock",
        data: stock.map((s) => s.total_stock),
        backgroundColor: ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"],
        borderRadius: 8,
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
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Clinic Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400">Inventory and healthcare management overview</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card icon={<FaUserInjured />} title="Patients" value={summary?.total_patients ?? 0} color="blue" />
        <Card icon={<FaCapsules />} title="Medicines" value={summary?.total_medicines ?? 0} color="green" />
        <Card icon={<FaTruck />} title="Suppliers" value={summary?.total_suppliers ?? 0} color="purple" />
        <Card icon={<FaExclamationTriangle />} title="Low Stock" value={summary?.low_stock_count ?? 0} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-5 dark:text-white">Medicine Usage Report</h3>
          {usage.length > 0 ? (
            <Line data={dataLine} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No usage data recorded yet.</p>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-5 dark:text-white">Medicine Stock Report</h3>
          {stock.length > 0 ? (
            <Bar data={dataBar} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No stock data recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

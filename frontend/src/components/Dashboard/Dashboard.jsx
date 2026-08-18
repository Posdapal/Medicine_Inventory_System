import React, { useEffect, useState } from "react";
import {
  Package, Boxes, AlertTriangle, XCircle,
  ArrowDownCircle, ArrowUpCircle, Clock, Ban,
  Truck, Tags, Users as UsersIcon,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import { PageHeader } from "../ui/Common";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { dashboardApi } from "../../api/endpoints";

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
    return (
      <div className="grow space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#E7ECF6]">Dashboard</h2>
          <p className="mt-1 text-sm text-[#8B96AE]">Inventory overview at a glance</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grow space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#E7ECF6]">Dashboard</h2>
          <p className="mt-1 text-sm text-[#8B96AE]">Inventory overview at a glance</p>
        </div>
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="grow space-y-6">
      <PageHeader title="Dashboard" subtitle="Dashboard / Overview" description="Inventory overview at a glance." />

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


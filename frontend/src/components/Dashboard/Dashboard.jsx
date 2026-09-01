import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Ban, Boxes, Clock, Package, RefreshCw, Tags, Truck, Users as UsersIcon, XCircle } from "lucide-react";
import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { PageHeader } from "../ui/Common";
import { dashboardApi } from "../../api/endpoints";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
const formatNumber = new Intl.NumberFormat("en-US");
const tones = {
  blue: ["bg-blue-50 text-blue-600 ring-blue-100", "bg-blue-50 text-blue-700", "Catalog"],
  green: ["bg-emerald-50 text-emerald-600 ring-emerald-100", "bg-emerald-50 text-emerald-700", "Available"],
  amber: ["bg-amber-50 text-amber-600 ring-amber-100", "bg-amber-50 text-amber-700", "Attention"],
  rose: ["bg-rose-50 text-rose-600 ring-rose-100", "bg-rose-50 text-rose-700", "Critical"],
  purple: ["bg-violet-50 text-violet-600 ring-violet-100", "bg-violet-50 text-violet-700", "Partners"],
  slate: ["bg-slate-100 text-slate-600 ring-slate-200", "bg-slate-100 text-slate-700", "Accounts"],
};

function StatCard({ icon: Icon, title, value, description, tone = "blue", compact = false, featured = false, onClick }) {
  const palette = tones[tone];
  return (
    <button type="button" onClick={onClick} aria-label={`Open ${title}`} className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${featured ? "border-blue-500 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-950/20" : "border-slate-200 bg-white shadow-lg shadow-slate-950/10 hover:border-blue-300"}`}>
      {featured && <div className="absolute -right-10 -top-16 h-40 w-40 rotate-12 rounded-[2.5rem] bg-white/10" />}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${featured ? "text-blue-50" : "text-slate-600"}`}>{title}</p>
          <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-bold tracking-tight ${featured ? "text-white" : "text-slate-950"}`}>{formatNumber.format(Number(value) || 0)}</p>
          {description && <p className={`mt-1.5 text-xs leading-5 ${featured ? "text-blue-50/80" : "text-slate-500"}`}>{description}</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${featured ? "bg-white/95 text-blue-600 ring-white" : palette[0]}`}><Icon size={21} /></div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${featured ? "bg-white/15 text-white" : palette[1]}`}>{palette[2]}</span>
        </div>
      </div>
    </button>
  );
}

function SectionHeading({ title, description }) {
  return <div className="mb-3"><h2 className="text-sm font-semibold text-[#DCE4F2]">{title}</h2><p className="mt-0.5 text-xs text-[#71809A]">{description}</p></div>;
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading dashboard">
      <div className="h-28 rounded-2xl bg-[#111A2C]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-[#111A2C]" />)}</div>
      <div className="grid gap-4 xl:grid-cols-3"><div className="h-[390px] rounded-2xl bg-[#111A2C] xl:col-span-2" /><div className="h-[390px] rounded-2xl bg-[#111A2C]" /></div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      setLoading(true); setError("");
      try {
        const response = await dashboardApi.overview();
        if (mounted) {
          setSummary(response.data?.summary || {});
          setChart(response.data?.stock_in_out_chart || []);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Dashboard data could not be loaded.");
      } finally { if (mounted) setLoading(false); }
    }
    loadDashboard();
    return () => { mounted = false; };
  }, [refreshKey]);

  const totals = useMemo(() => chart.reduce((sum, row) => ({ incoming: sum.incoming + Number(row.stock_in || 0), outgoing: sum.outgoing + Number(row.stock_out || 0) }), { incoming: 0, outgoing: 0 }), [chart]);
  const data = {
    labels: chart.map((item) => item.month),
    datasets: [
      { label: "Stock In", data: chart.map((item) => Number(item.stock_in || 0)), backgroundColor: "#3B82F6", hoverBackgroundColor: "#60A5FA", borderRadius: 8, borderSkipped: false, maxBarThickness: 32 },
      { label: "Stock Out", data: chart.map((item) => Number(item.stock_out || 0)), backgroundColor: "#A855F7", hoverBackgroundColor: "#C084FC", borderRadius: 8, borderSkipped: false, maxBarThickness: 32 },
    ],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, animation: { duration: 500 },
    plugins: {
      legend: { position: "bottom", align: "start", labels: { color: "#475569", usePointStyle: true, pointStyle: "circle", padding: 20, boxWidth: 8, boxHeight: 8, font: { weight: 600 } } },
      tooltip: { backgroundColor: "#FFFFFF", titleColor: "#0F172A", bodyColor: "#475569", borderColor: "#E2E8F0", borderWidth: 1, padding: 12, displayColors: true, callbacks: { label: (context) => ` ${context.dataset.label}: ${formatNumber.format(context.parsed.y)}` } },
    },
    scales: {
      x: { border: { display: false }, ticks: { color: "#64748B", padding: 8 }, grid: { display: false } },
      y: { beginAtZero: true, border: { display: false }, ticks: { color: "#64748B", precision: 0, padding: 10 }, grid: { color: "#E2E8F0", drawTicks: false } },
    },
  };

  if (loading) return <DashboardSkeleton />;
  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="grow space-y-7">
      <PageHeader title="Dashboard" subtitle="Dashboard / Overview" description="Monitor inventory health, daily activity, and stock movement trends." action={<button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-[#2A3A5A] bg-[#10192A] px-3.5 py-2 text-sm font-medium text-[#B8C3D6] transition hover:border-teal-500/40 hover:text-teal-300"><RefreshCw size={15} /> Refresh</button>} />

      {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3"><div className="flex items-center gap-3 text-sm text-rose-200"><AlertTriangle size={18} /><span>{error}</span></div><button type="button" onClick={refresh} className="text-sm font-semibold text-rose-300 hover:text-white">Try again</button></div>}

      <section>
        <SectionHeading title="Inventory health" description="The most important indicators requiring daily attention." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard featured icon={Package} title="Total Products" value={summary?.total_products} description="Active products in the catalog" tone="blue" onClick={() => onNavigate("product-list", "products", { status: "active" })} />
          <StatCard icon={Boxes} title="In Stock Products" value={summary?.in_stock} description="Active products with available stock" tone="green" onClick={() => onNavigate("current-stock", "stock-management", { stock_status: "in_stock" })} />
          <StatCard icon={AlertTriangle} title="Low Stock" value={summary?.low_stock} description="At or below minimum level" tone="amber" onClick={() => onNavigate("current-stock", "stock-management", { stock_status: "low_stock" })} />
          <StatCard icon={XCircle} title="Out of Stock" value={summary?.out_of_stock} description="Products needing replenishment" tone="rose" onClick={() => onNavigate("current-stock", "stock-management", { stock_status: "out_of_stock" })} />
        </div>
      </section>

      <section>
        <SectionHeading title="Today & alerts" description="Current activity and expiry risks." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard compact icon={ArrowDownCircle} title="Stock In Today" value={summary?.stock_in_today} description="Completed receipts today" tone="green" onClick={() => onNavigate("stock-in", "stock-management", { date: "today" })} />
          <StatCard compact icon={ArrowUpCircle} title="Stock Out Today" value={summary?.stock_out_today} description="Completed issues today" tone="blue" onClick={() => onNavigate("stock-out", "stock-management", { date: "today" })} />
          <StatCard compact icon={Clock} title="Near Expiry" value={summary?.near_expiry} description="Batches approaching expiry" tone="amber" onClick={() => onNavigate("near-expiry", "expiry-management")} />
          <StatCard compact icon={Ban} title="Expired Batches" value={summary?.expired_products} description="Available batches requiring action" tone="rose" onClick={() => onNavigate("expired-products", "expiry-management")} />
        </div>
      </section>

      <section>
        <SectionHeading title="System records" description="Supporting master data currently available." />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard compact icon={Truck} title="Suppliers" value={summary?.total_suppliers} tone="purple" onClick={() => onNavigate("suppliers", undefined, { status: "active" })} />
          <StatCard compact icon={Tags} title="Categories" value={summary?.total_categories} tone="blue" onClick={() => onNavigate("categories", "products", { status: "active" })} />
          <StatCard compact icon={UsersIcon} title="Users" value={summary?.total_users} tone="slate" onClick={() => onNavigate("users", undefined, { status: "active" })} />
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex items-center gap-2"><Activity size={18} className="text-blue-600" /><h2 className="font-semibold text-slate-950">Stock Analytics</h2></div><p className="mt-1 text-xs text-slate-500">Monthly inventory received versus issued over the last six months.</p></div>
            <div className="flex gap-2 text-xs"><span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">In {formatNumber.format(totals.incoming)}</span><span className="rounded-full bg-purple-50 px-3 py-1.5 font-semibold text-purple-700">Out {formatNumber.format(totals.outgoing)}</span></div>
          </div>
          <div className="mt-5 h-[360px]">{chart.length ? <Bar data={data} options={options} /> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No stock movement recorded yet.</div>}</div>
        </div>
      </section>
    </div>
  );
}

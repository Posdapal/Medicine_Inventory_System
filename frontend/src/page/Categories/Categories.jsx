import React from "react";
import { useState, useEffect } from "react";
import { categoriesApi } from "../../api/endpoints";

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E7ECF6] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#8B96AE] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A45] text-left text-[#8B96AE] text-xs uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-[#1E2A45] last:border-0 hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[#D7DEEB]">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-[#5D6B85] text-sm">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Categories() {
  const [tab, setTab] = useState("medicine");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      setLoading(true);
      setError("");
      try {
        const { data } = await categoriesApi.getAll(tab);
        if (isMounted) setRows(data.map((c) => ({ ...c, count: c.item_count })));
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [tab]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Categories" subtitle="Shared lookup for medicines and products" />
      <div className="flex gap-2 mb-4">
        {["medicine", "product"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              tab === t ? "bg-blue-600 border-blue-600 text-white" : "bg-[#0F1626] border-[#1E2A45] text-[#8B96AE] hover:text-[#E7ECF6]"
            }`}
          >
            {t === "medicine" ? "Medicine Categories" : "Product Categories"}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#8B96AE]">Loading categories...</p>
      ) : (
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "count", label: "Items", render: (r) => <Badge tone="info">{r.count}</Badge> },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}

export default Categories;

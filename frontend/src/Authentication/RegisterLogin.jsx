import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function RegisterLogin({ onLogin }) {
  const { login, loading, error } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onLogin) onLogin();
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#141E33] border border-[#1E2A45] rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="p-7">
            <div className="flex items-center gap-2 justify-center mb-8">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Stethoscope size={18} className="text-white" />
              </div>
              <span className="text-xl font-semibold text-[#E7ECF6] tracking-tight">Medicine Inventory System</span>
            </div>
            <h2 className="text-lg font-semibold text-[#E7ECF6] mb-1">Welcome back</h2>
            <p className="text-sm text-[#8B96AE] mb-6">Sign in to manage the clinic dashboard.</p>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8B96AE] mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8B96AE] mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D6B85]" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1E2A45] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#E7ECF6] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D6B85] hover:text-[#8B96AE]"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 text-[#8B96AE]">
                  <input type="checkbox" className="rounded border-[#1E2A45]" /> Remember me
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white text-sm font-medium py-2.5 rounded-lg"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-[#5D6B85] mt-5">Medicine Inventory System &middot; Healthcare inventory management</p>
      </div>
    </div>
  );
}

export default RegisterLogin;

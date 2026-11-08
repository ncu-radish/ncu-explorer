"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);

  // Login Form State
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const res = await adminApi.getMe();
      if (res && res.is_authenticated) {
        setIsAuthenticated(true);
        setAdminUser({ username: res.username, role: res.role });
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setAdminUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("請輸入帳號與密碼");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.login(username.trim(), password);
      setIsAuthenticated(true);
      setAdminUser({ username: res.username, role: res.role });
    } catch (err: any) {
      setErrorMessage(err.message?.replace("API Error [401]:", "") || "帳號或密碼錯誤，請重新確認");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    setIsAuthenticated(false);
    setAdminUser(null);
    setPassword("");
  };

  // While checking auth status on initial mount
  if (isAuthenticated === null) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center bg-[#faf8ff] text-stone-500 gap-3">
        <div className="w-7 h-7 border-2 border-stone-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-medium">驗證管理員身分中...</span>
      </div>
    );
  }

  // Not logged in: Show Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center p-4 bg-[#faf8ff]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-300/80 shadow-md p-6 sm:p-8">
          {/* Top Return Button */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>回相關資料</span>
            </Link>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              受保護的管理區域
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white mx-auto flex items-center justify-center mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">管理後台身分驗證</h1>
            <p className="text-xs text-stone-500 mt-1">
              後端管理 API 已啟用嚴格防護，請登入管理員帳號以進行模型更新與系統設定
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                管理員帳號
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                管理員密碼
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  required
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-md"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>驗證中...</span>
                </>
              ) : (
                <span>登入管理後台</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-200 text-center">
            <p className="text-[11px] text-stone-500">
              預設帳號: <span className="font-mono text-stone-700 font-bold">admin</span> / 預設密碼: <span className="font-mono text-stone-700 font-bold">adminpassword123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in: Render children with admin status badge
  return (
    <div className="w-full flex flex-col min-h-screen bg-[#faf8ff]">
      {/* Admin Top Status Bar */}
      <div className="w-full bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-stone-600">已登入管理員：</span>
          <span className="font-bold text-stone-900 font-mono">{adminUser?.username}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            {adminUser?.role}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-stone-600 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          title="登出管理員"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>登出</span>
        </button>
      </div>

      {children}
    </div>
  );
}

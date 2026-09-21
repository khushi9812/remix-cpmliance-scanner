import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Menu,
  X,
  Home,
  PlusCircle,
  Inbox,
  FileText,
  User,
  ClipboardList,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useInspector } from "@/lib/inspector-store";
import { ConnectivityStatus } from "@/components/ConnectivityStatus";

interface NirikshaLayoutProps {
  children: React.ReactNode;
  activeNav?: "home" | "inspections" | "new" | "reports" | "profile" | "drafts";
  title?: string;
  hideBottomNav?: boolean;
  hideTopBar?: boolean;
  variant?: "default" | "neo-industrial";
}

export function NirikshaLayout({
  children,
  activeNav = "home",
  title = "NiriKsha",
  hideBottomNav = false,
  hideTopBar = false,
  variant = "default",
}: NirikshaLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isConsumer, logoutUser } = useInspector();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const isNeo = variant === "neo-industrial";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative ${
        isNeo
          ? "bg-[#0d0d11] text-zinc-100 pb-16 md:pb-6"
          : "bg-[#f1f3f6] text-slate-800 pb-20 md:pb-16"
      }`}
    >
      {/* Top App Bar (Optional when custom header is used) */}
      {!hideTopBar && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="niriksha-menu-toggle"
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>

          {/* Center Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none max-w-[40%] sm:max-w-[50%]">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 select-none truncate text-center">
              {title}
            </h1>
          </div>

          {/* Right side Status & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Role Indicator */}
            <button
              id="header-role-badge"
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer"
              title="Click to switch between Inspector and Consumer login"
            >
              {isConsumer ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <UserCheck className="size-3 text-emerald-600" />
                  Consumer
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors">
                  <ShieldCheck className="size-3 text-blue-600" />
                  Inspector
                </span>
              )}
            </button>

            <ConnectivityStatus />

            <button
              id="niriksha-profile-btn"
              type="button"
              onClick={() => navigate("/profile")}
              className="size-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer shadow-xs overflow-hidden shrink-0"
              title={`${profile.name} (${isConsumer ? "Consumer" : "Inspector"})`}
            >
              <User className="size-5" />
            </button>
          </div>
        </header>
      )}

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <div
          id="niriksha-sidebar-overlay"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="niriksha-drawer-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              NiriKsha
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Legal Metrology Inspection</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Officer / Consumer Profile Card in Drawer */}
        <div
          onClick={() => handleNav("/profile")}
          className="p-5 border-b border-slate-100 flex items-center gap-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
        >
          <div className="relative">
            <div className="size-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-105 transition-transform">
              <User className="size-7" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold ${
                isConsumer ? "bg-emerald-600" : "bg-blue-600"
              }`}
            >
              {isConsumer ? "C" : "I"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">
              {profile.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {profile.designation}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-slate-400 truncate">
                ID: {profile.id}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isConsumer
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isConsumer ? "Consumer" : "Inspector"}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-3 flex-1 space-y-1.5 overflow-y-auto">
          <button
            id="sidebar-item-dashboard"
            type="button"
            onClick={() => handleNav("/dashboard")}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === "home"
                ? "bg-[#0c1b33] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Home className="size-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            id="sidebar-item-scan"
            type="button"
            onClick={() => handleNav("/scan")}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === "new"
                ? "bg-[#0c1b33] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <PlusCircle className="size-4.5" />
            <span>{isConsumer ? "Scan Product Label" : "New Inspection"}</span>
          </button>

          <button
            id="sidebar-item-drafts"
            type="button"
            onClick={() => handleNav("/drafts")}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === "drafts"
                ? "bg-[#0c1b33] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Inbox className="size-4.5" />
            <span>Draft Inspections</span>
          </button>

          <button
            id="sidebar-item-reports"
            type="button"
            onClick={() => handleNav("/reports")}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === "reports"
                ? "bg-[#0c1b33] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="size-4.5" />
            <span>Reports Archive</span>
          </button>

          <button
            id="sidebar-item-profile"
            type="button"
            onClick={() => handleNav("/profile")}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === "profile"
                ? "bg-[#0c1b33] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <User className="size-4.5" />
            <span>Profile</span>
          </button>

          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              id="sidebar-item-login"
              type="button"
              onClick={() => handleNav("/login")}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-all cursor-pointer"
            >
              <LogIn className="size-4.5 text-blue-600" />
              <span>Switch Login / Roles</span>
            </button>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700">Legal Metrology Dept.</p>
            <p className="text-[11px] text-slate-500">v1.0.0 (SIH 2026)</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logoutUser();
              handleNav("/login");
            }}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium cursor-pointer"
            title="Log out"
          >
            <LogOut className="size-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {children}
      </div>

      {/* Bottom Navigation Bar */}
      {!hideBottomNav && (
        <nav
          id="niriksha-bottom-nav"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around"
        >
          <button
            id="bottom-nav-home"
            type="button"
            onClick={() => navigate("/dashboard")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeNav === "home"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeNav === "home" ? "bg-slate-100" : ""
              }`}
            >
              <Home className="size-5" />
            </div>
            <span className="text-[11px] mt-0.5">Home</span>
          </button>

          <button
            id="bottom-nav-inspections"
            type="button"
            onClick={() => navigate("/dashboard?tab=repository")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeNav === "inspections"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeNav === "inspections" ? "bg-slate-100" : ""
              }`}
            >
              <ClipboardList className="size-5" />
            </div>
            <span className="text-[11px] mt-0.5">Inspections</span>
          </button>

          <button
            id="bottom-nav-new"
            type="button"
            onClick={() => navigate("/scan")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeNav === "new"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeNav === "new" ? "bg-slate-100" : ""
              }`}
            >
              <PlusCircle className="size-5" />
            </div>
            <span className="text-[11px] mt-0.5">New</span>
          </button>

          <button
            id="bottom-nav-reports"
            type="button"
            onClick={() => navigate("/reports")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeNav === "reports"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeNav === "reports" ? "bg-slate-100" : ""
              }`}
            >
              <FileText className="size-5" />
            </div>
            <span className="text-[11px] mt-0.5">Reports</span>
          </button>

          <button
            id="bottom-nav-profile"
            type="button"
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeNav === "profile"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1.5 px-3 rounded-xl ${
                activeNav === "profile" ? "bg-slate-200 text-slate-900" : ""
              }`}
            >
              <User className="size-5" />
            </div>
            <span className="text-[11px] mt-0.5">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { NirikshaLayout } from "@/components/NirikshaLayout";
import { useInspector } from "@/lib/inspector-store";
import {
  User,
  Briefcase,
  Building2,
  Pencil,
  KeyRound,
  Clock,
  ChevronRight,
  Check,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NirikshaProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile, isConsumer, logoutUser } = useInspector();

  // Edit fields state
  const [editingField, setEditingField] = useState<"email" | "phone" | "jurisdiction" | null>(null);
  const [fieldValue, setFieldValue] = useState("");

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleStartEdit = (field: "email" | "phone" | "jurisdiction") => {
    setEditingField(field);
    setFieldValue(profile[field]);
  };

  const handleSaveField = () => {
    if (!editingField) return;
    if (!fieldValue.trim()) {
      toast.error("Value cannot be empty");
      return;
    }
    updateProfile({ [editingField]: fieldValue.trim() });
    toast.success(`Updated ${editingField === "email" ? "Email Address" : editingField === "phone" ? "Phone Number" : "Jurisdiction Region"}`);
    setEditingField(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Security credentials updated successfully.");
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <NirikshaLayout activeNav="profile" title="NiriKsha">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
        {/* Profile Hero Section */}
        <section className="flex flex-col items-center justify-center text-center pt-4">
          <div className="relative">
            <div className="size-28 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-600 shadow-sm mb-4">
              <User className="size-16" />
            </div>
            <span
              className={`absolute bottom-4 right-0 size-7 rounded-full flex items-center justify-center text-white shadow-xs ${
                isConsumer ? "bg-emerald-600" : "bg-blue-600"
              }`}
              title={isConsumer ? "Consumer Role" : "Inspector Role"}
            >
              {isConsumer ? (
                <UserCheck className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {profile.name}
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isConsumer
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              {isConsumer ? "Citizen Consumer" : "Legal Metrology Inspector"}
            </span>
          </div>
          <p className="text-sm font-mono text-slate-500 mt-1">
            ID: {profile.id}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Briefcase className="size-4 text-slate-500" />
              <span>{profile.designation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-slate-500" />
              <span>{profile.department}</span>
            </div>
          </div>

          {/* Quick Account Switcher / Login Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              id="profile-switch-account-btn"
              type="button"
              onClick={() => navigate(isConsumer ? "/login?role=inspector" : "/login?role=consumer")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer"
            >
              <LogIn className="size-3.5 text-slate-500" />
              <span>Switch to {isConsumer ? "Inspector Login" : "Consumer Login"}</span>
            </button>

            <button
              id="profile-logout-btn"
              type="button"
              onClick={() => {
                logoutUser();
                toast.info("Logged out of NiriKsha");
                navigate("/login");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {/* Section 1: ACCOUNT INFORMATION */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Information
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Email Address */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </p>
                {editingField === "email" ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="h-8 text-sm max-w-sm"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 px-2.5 bg-[#0c1b33]" onClick={handleSaveField}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingField(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {profile.email}
                  </p>
                )}
              </div>
              {editingField !== "email" && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("email")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit email address"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>

            {/* Phone Number */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </p>
                {editingField === "phone" ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="h-8 text-sm max-w-sm"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 px-2.5 bg-[#0c1b33]" onClick={handleSaveField}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingField(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {profile.phone}
                  </p>
                )}
              </div>
              {editingField !== "phone" && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("phone")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit phone number"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>

            {/* Jurisdiction Region */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Jurisdiction Region
                </p>
                {editingField === "jurisdiction" ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="h-8 text-sm max-w-sm"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 px-2.5 bg-[#0c1b33]" onClick={handleSaveField}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingField(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {profile.jurisdiction}
                  </p>
                )}
              </div>
              {editingField !== "jurisdiction" && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("jurisdiction")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit jurisdiction region"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: SECURITY */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Change Password row */}
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 tracking-widest text-sm">***</span>
                <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
                  Change Password
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Last Login row */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Last Login</p>
                  <p className="text-xs text-slate-400 mt-0.5">{profile.lastLogin}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                Verified Session
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-slate-700" />
                <h4 className="text-lg font-bold text-slate-900">Change Password</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0c1b33] hover:bg-[#152a4e]">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </NirikshaLayout>
  );
}

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { NirikshaBrandLogo } from "@/components/NirikshaBrandLogo";
import {
  loginAsInspector,
  loginAsConsumer,
} from "@/lib/inspector-store";

interface AuthProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = "/dashboard" }: AuthProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role Tab: "inspector" | "consumer"
  const initialRole = searchParams.get("role") === "consumer" ? "consumer" : "inspector";
  const [activeRole, setActiveRole] = useState<"inspector" | "consumer">(initialRole);

  // Inspector form states
  const [inspectorId, setInspectorId] = useState("DOCA-INSP-842");
  const [inspectorPassword, setInspectorPassword] = useState("••••••••");
  const [showInspectorPassword, setShowInspectorPassword] = useState(false);

  // Consumer form states
  const [consumerIdentifier, setConsumerIdentifier] = useState("+91 98765 43210");
  const [consumerPassword, setConsumerPassword] = useState("••••••");
  const [showConsumerPassword, setShowConsumerPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Server address from the prototype screenshot
  const serverEndpoint = "https://beautiful-feeling-convert-promptly.trycloudflare.com";

  const handleInspectorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorId.trim()) {
      toast.error("Please enter your Inspector ID / Username");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      loginAsInspector(inspectorId.trim(), "Inspector Rajesh Kumar");
      toast.success("Inspector authentication successful", {
        description: `Welcome back, ${inspectorId.trim()}`,
      });
      setIsLoading(false);
      const destination = searchParams.get("returnTo") || redirectAfterAuth;
      navigate(destination);
    }, 450);
  };

  const handleConsumerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerIdentifier.trim()) {
      toast.error("Please enter your mobile number or email");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      loginAsConsumer("CONS-IND-842", "Priya Sharma");
      toast.success("Consumer login successful", {
        description: "Welcome to NiriKsha Consumer Verification Portal",
      });
      setIsLoading(false);
      const destination = searchParams.get("returnTo") || redirectAfterAuth;
      navigate(destination);
    }, 450);
  };

  const fillInspectorDemo = () => {
    setInspectorId("DOCA-INSP-842");
    setInspectorPassword("Metrology@2026");
  };

  const fillConsumerDemo = () => {
    setConsumerIdentifier("+91 98765 43210");
    setConsumerPassword("Citizen@2026");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Central Login Container matching screenshot */}
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-98 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* Logo & Subtitle */}
          <NirikshaBrandLogo size="md" />

          <div className="w-full border-t border-slate-100 my-5" />

          {/* Role Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 border border-slate-200/60">
            <button
              id="role-tab-inspector"
              type="button"
              onClick={() => setActiveRole("inspector")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeRole === "inspector"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>Inspector</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-bold hidden sm:inline">
                DOCA
              </span>
            </button>

            <button
              id="role-tab-consumer"
              type="button"
              onClick={() => setActiveRole("consumer")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeRole === "consumer"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserCheck className="size-3.5 text-emerald-600" />
              <span>Consumer</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold hidden sm:inline">
                Citizen
              </span>
            </button>
          </div>

          {/* INSPECTOR FORM (Screenshot Layout) */}
          {activeRole === "inspector" && (
            <form onSubmit={handleInspectorLogin} className="space-y-4">
              {/* Username / Inspector ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="inspector-id-input"
                    className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block"
                  >
                    INSPECTOR ID / USERNAME
                  </label>
                  <button
                    type="button"
                    onClick={fillInspectorDemo}
                    className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Use Sample ID
                  </button>
                </div>
                <input
                  id="inspector-id-input"
                  type="text"
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  placeholder="DOCA-INSP-842"
                  required
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1b33] focus:border-transparent transition-all placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="inspector-password-input"
                  className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="inspector-password-input"
                    type={showInspectorPassword ? "text" : "password"}
                    value={inspectorPassword}
                    onChange={(e) => setInspectorPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1b33] focus:border-transparent transition-all placeholder:text-slate-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInspectorPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showInspectorPassword ? "Hide password" : "Show password"}
                  >
                    {showInspectorPassword ? (
                      <EyeOff className="size-4.5" />
                    ) : (
                      <Eye className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                id="sign-in-inspector-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-11 bg-[#0c1b33] hover:bg-[#152a4e] active:bg-[#081223] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn className="size-4 ml-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* CONSUMER FORM */}
          {activeRole === "consumer" && (
            <form onSubmit={handleConsumerLogin} className="space-y-4">
              {/* Identifier (Phone or Email) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="consumer-id-input"
                    className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block"
                  >
                    MOBILE NUMBER / CONSUMER EMAIL
                  </label>
                  <button
                    type="button"
                    onClick={fillConsumerDemo}
                    className="text-[10px] text-emerald-600 hover:underline font-medium cursor-pointer"
                  >
                    Use Sample ID
                  </button>
                </div>
                <input
                  id="consumer-id-input"
                  type="text"
                  value={consumerIdentifier}
                  onChange={(e) => setConsumerIdentifier(e.target.value)}
                  placeholder="+91 98765 43210 or name@example.com"
                  required
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1b33] focus:border-transparent transition-all placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Password / OTP */}
              <div>
                <label
                  htmlFor="consumer-password-input"
                  className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5"
                >
                  PASSWORD / OTP
                </label>
                <div className="relative">
                  <input
                    id="consumer-password-input"
                    type={showConsumerPassword ? "text" : "password"}
                    value={consumerPassword}
                    onChange={(e) => setConsumerPassword(e.target.value)}
                    placeholder="Enter password or OTP"
                    required
                    className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1b33] focus:border-transparent transition-all placeholder:text-slate-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConsumerPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showConsumerPassword ? "Hide password" : "Show password"}
                  >
                    {showConsumerPassword ? (
                      <EyeOff className="size-4.5" />
                    ) : (
                      <Eye className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button for Consumer */}
              <button
                id="sign-in-consumer-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-11 bg-[#0c1b33] hover:bg-[#152a4e] active:bg-[#081223] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In as Consumer</span>
                    <ArrowRight className="size-4 ml-0.5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Empowering consumers to verify MRP, net quantity & manufacturer contact declarations under PCR 2011.
              </p>
            </form>
          )}

          {/* Server status footer directly inside card matching screenshot */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono overflow-hidden">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              Server: <span className="text-slate-500">{serverEndpoint}</span>
            </span>
          </div>
        </div>

        {/* Footer Outside Card */}
        <div className="mt-4 flex flex-col items-center text-center space-y-1 text-slate-500">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Lock className="size-3.5 text-slate-400" />
            <span>
              {activeRole === "inspector"
                ? "Authorized inspection personnel only"
                : "Authorized Consumer & Citizen Redressal Portal"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            NiriKsha — SIH Prototype 2026
          </p>
        </div>
      </div>
    </div>
  );
}

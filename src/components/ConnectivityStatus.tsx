import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { queueCount } from "@/lib/scan-client";

interface ConnectivityStatusProps {
  className?: string;
  compact?: boolean;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  className = "",
  compact = false,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Effective status considers simulation
  const effectiveOnline = isOnline && !simulatedOffline;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial count
    try {
      setOfflineCount(queueCount());
    } catch {
      setOfflineCount(0);
    }

    const interval = setInterval(() => {
      try {
        setOfflineCount(queueCount());
      } catch {
        // ignore
      }
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      try {
        setOfflineCount(queueCount());
      } catch {
        // ignore
      }
      setIsSyncing(false);
    }, 800);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Main Status Badge */}
      <button
        id="connectivity-status-indicator"
        type="button"
        onClick={() => setShowPopover((prev) => !prev)}
        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          effectiveOnline
            ? "bg-emerald-50/90 text-emerald-800 border-emerald-200 hover:bg-emerald-100/90 hover:border-emerald-300 focus:ring-emerald-400"
            : "bg-amber-50 text-amber-900 border-amber-300 shadow-xs hover:bg-amber-100 hover:border-amber-400 focus:ring-amber-500 animate-pulse"
        }`}
        title={
          effectiveOnline
            ? "Network Status: Online (Data synchronization active)"
            : "Network Status: Offline (Data synchronization paused)"
        }
        aria-label={`Connectivity status: ${effectiveOnline ? "Online" : "Offline"}`}
      >
        {/* Status Dot / Pulse Beacon */}
        <span className="relative flex size-2 shrink-0">
          {!effectiveOnline && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75 duration-1000"
              aria-hidden="true"
            />
          )}
          <span
            className={`relative inline-flex size-2 rounded-full ${
              effectiveOnline ? "bg-emerald-500" : "bg-amber-600"
            }`}
          />
        </span>

        {/* Icon */}
        {effectiveOnline ? (
          <Wifi className="size-3.5 text-emerald-600 shrink-0" />
        ) : (
          <WifiOff className="size-3.5 text-amber-700 shrink-0" />
        )}

        {/* Status Label */}
        <span className="font-semibold tracking-tight">
          {effectiveOnline ? "Online" : "Offline"}
        </span>

        {/* Extended Text on Non-compact / Desktop */}
        {!compact && (
          <span
            className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
              effectiveOnline
                ? "bg-emerald-100/80 text-emerald-700"
                : "bg-amber-200/70 text-amber-800"
            }`}
          >
            {effectiveOnline ? "Sync Active" : "Sync Paused"}
          </span>
        )}

        {/* Queue badge indicator when items exist */}
        {offlineCount > 0 && (
          <span
            className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-600 text-white"
            title={`${offlineCount} inspection(s) queued for sync`}
          >
            {offlineCount}
          </span>
        )}
      </button>

      {/* Popover / Flyout Details */}
      {showPopover && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowPopover(false)}
          />
          <div
            id="connectivity-status-popover"
            className="absolute right-0 mt-2 z-50 w-72 rounded-xl bg-white p-3.5 shadow-xl border border-slate-200 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  {!effectiveOnline && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex size-2.5 rounded-full ${
                      effectiveOnline ? "bg-emerald-500" : "bg-amber-600"
                    }`}
                  />
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {effectiveOnline ? "Online Connectivity" : "Offline Mode"}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  effectiveOnline
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-300"
                }`}
              >
                {effectiveOnline ? "Sync Active" : "Sync Paused"}
              </span>
            </div>

            <div className="py-2.5 space-y-2 text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                {effectiveOnline ? (
                  <Cloud className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <CloudOff className="size-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  {effectiveOnline ? (
                    <p>
                      Direct cloud connection active. Statutory records and inspection
                      evidence synchronize instantaneously with the central database.
                    </p>
                  ) : (
                    <p>
                      Data synchronization is <strong className="text-amber-900">paused</strong>.
                      New inspections and label measurements are safely preserved in local
                      storage until connectivity is restored.
                    </p>
                  )}
                </div>
              </div>

              {offlineCount > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-900 flex items-center justify-between">
                  <span>Queued Inspections</span>
                  <span className="font-bold bg-amber-200 px-1.5 py-0.5 rounded text-xs">
                    {offlineCount} pending
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions & Field Mode Simulation */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <button
                id="connectivity-toggle-simulation-btn"
                type="button"
                onClick={() => setSimulatedOffline((prev) => !prev)}
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  simulatedOffline
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {simulatedOffline ? (
                  <>
                    <Wifi className="size-3.5" />
                    Resume Real Connection
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3.5 text-amber-700" />
                    Simulate Offline (Field Test)
                  </>
                )}
              </button>

              <button
                id="connectivity-refresh-btn"
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-3.5 text-slate-500 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Verifying..." : "Check Synchronization Status"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

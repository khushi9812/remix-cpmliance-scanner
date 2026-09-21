import { useState, useEffect } from "react";
import { InspectorProfile } from "@/types/inspector";

export const DEFAULT_INSPECTOR: InspectorProfile = {
  id: "DOCA-INSP-842",
  name: "Inspector Rajesh Kumar",
  role: "Senior Inspector",
  portalRole: "officer",
  userType: "inspector",
  designation: "Senior Inspector (Legal Metrology)",
  department: "Legal Metrology Dept., DOCA",
  email: "rajesh.kumar@lm.gov.in",
  phone: "+919876543210",
  jurisdiction: "Northern Zone - Delhi HQ",
  badgeNumber: "DOCA-INSP-842",
  lastLogin: "21 Sept 2026, 09:30 IST • Delhi HQ Field Device",
  isLoggedIn: true,
};

export const DEFAULT_CONSUMER: InspectorProfile = {
  id: "CONS-IND-842",
  name: "Priya Sharma",
  role: "Consumer",
  portalRole: "consumer",
  userType: "consumer",
  designation: "Verified Citizen Consumer",
  department: "National Consumer Helpline / Citizen Portal",
  email: "priya.sharma@consumer.org.in",
  phone: "+919876543211",
  jurisdiction: "All India Retail Consumer Verification",
  badgeNumber: "CITIZEN-VERIFIED",
  lastLogin: "21 Sept 2026, 10:15 IST • Citizen Mobile Portal",
  isLoggedIn: true,
};

const STORAGE_KEY = "niriksha_inspector_profile_v1";

export function getStoredInspector(): InspectorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_INSPECTOR, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_INSPECTOR;
}

export function saveStoredInspector(profile: InspectorProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("niriksha_profile_updated"));
  } catch {
    // fallback
  }
}

export function loginAsInspector(id = "DOCA-INSP-842", name = "Inspector Rajesh Kumar") {
  const profile: InspectorProfile = {
    ...DEFAULT_INSPECTOR,
    id: id || "DOCA-INSP-842",
    name: name || "Inspector Rajesh Kumar",
    isLoggedIn: true,
    lastLogin: `${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST • Field Terminal`,
  };
  saveStoredInspector(profile);
  return profile;
}

export function loginAsConsumer(id = "CONS-IND-842", name = "Priya Sharma") {
  const profile: InspectorProfile = {
    ...DEFAULT_CONSUMER,
    id: id || "CONS-IND-842",
    name: name || "Priya Sharma (Consumer)",
    isLoggedIn: true,
    lastLogin: `${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST • Citizen Portal`,
  };
  saveStoredInspector(profile);
  return profile;
}

export function logoutUser() {
  const profile: InspectorProfile = {
    ...getStoredInspector(),
    isLoggedIn: false,
  };
  saveStoredInspector(profile);
  return profile;
}

export function useInspector() {
  const [profile, setProfile] = useState<InspectorProfile>(getStoredInspector);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getStoredInspector());
    };
    window.addEventListener("niriksha_profile_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("niriksha_profile_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateProfile = (partial: Partial<InspectorProfile>) => {
    const updated = { ...profile, ...partial };
    setProfile(updated);
    saveStoredInspector(updated);
  };

  return {
    profile,
    updateProfile,
    isConsumer: profile.userType === "consumer" || profile.portalRole === "consumer",
    isInspector: profile.userType !== "consumer" && profile.portalRole !== "consumer",
    loginAsInspector,
    loginAsConsumer,
    logoutUser,
  };
}

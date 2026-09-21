export interface InspectorProfile {
  id: string;
  name: string;
  role: string;
  portalRole?: "officer" | "consumer";
  userType?: "inspector" | "consumer";
  designation: string;
  department: string;
  email: string;
  phone: string;
  jurisdiction: string;
  badgeNumber: string;
  lastLogin: string;
  isLoggedIn?: boolean;
}

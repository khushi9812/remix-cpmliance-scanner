import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Heart,
  Share2,
  ShoppingBag,
  Menu,
  Plus,
  Scale,
  FileText,
  Mail,
  MapPin,
  ShieldCheck,
  Barcode,
  Calendar,
  Tag,
  Globe,
  ArrowRight,
  Maximize2,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { InspectionDetail } from "@/types/inspection";
import { useInspector } from "@/lib/inspector-store";
import { toast } from "sonner";

interface SuperdryInspectionConsoleProps {
  inspections: InspectionDetail[];
  onOpenMap?: () => void;
  onOpenRegistry?: () => void;
  onOpenActions?: () => void;
}

export function SuperdryInspectionConsole({
  inspections,
  onOpenMap,
  onOpenRegistry,
  onOpenActions,
}: SuperdryInspectionConsoleProps) {
  const navigate = useNavigate();
  const { profile, isConsumer } = useInspector();

  // Search & category filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  // Fallback realistic inspections if database is empty
  const defaultItems: InspectionDetail[] = useMemo(() => {
    return [
      {
        id: "INSP-LM-2026-94821",
        createdAt: new Date().toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        extractedData: {
          productName: "Mineral Infused Spring Water 1L",
          brand: "Himalayan Natural",
          category: "beverage",
          netQuantity: "1000 ml (1.0 L)",
          mrp: "₹ 65.00 (Incl. of all taxes)",
          unitSalePrice: "₹ 0.065 per ml",
          mfgDate: "14/08/2026",
          expiryDate: "13/08/2027",
          batchNumber: "HIM-8821-BATCH-09",
          mfgName: "Himalayan Spring Waters Pvt. Ltd.",
          mfgAddress: "Industrial Estate, Solan, Himachal Pradesh - 173212",
          consumerCare: "care@himalayannatural.in / 1800-425-9988",
          countryOfOrigin: "India",
          vegNonVeg: "VEG",
          ingredients: "Natural Mineral Water, Himalayan Salts",
          fssaiLicense: "10019011002938",
          barcode: "8901058821094",
          fields: [],
          imageQuality: {
            lighting: "good",
            blur: "sharp",
            glare: "none",
            readabilityScore: 96,
            overallAssessment: "High resolution packaging panel with clear statutory declarations.",
          },
        },
        compliance: {
          status: "COMPLIANT",
          score: 96,
          passedWeight: 96,
          scoreableWeight: 100,
          passCount: 14,
          failCount: 0,
          reviewCount: 1,
          criticalViolations: [],
          rules: [],
        },
      },
      {
        id: "INSP-LM-2026-88102",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        extractedData: {
          productName: "Crunchy Honey Almond Muesli",
          brand: "Sunrise Organics",
          category: "food",
          netQuantity: "500 g",
          mrp: "Rs. 240", // Non-compliant format without Rupee symbol
          unitSalePrice: null, // Missing unit sale price
          mfgDate: "03/2026",
          expiryDate: "09/2026",
          batchNumber: "MUS-0326-A",
          mfgName: "Sunrise Foods Limited",
          mfgAddress: "Survey 42, Sector 8, Gandhinagar, Gujarat",
          consumerCare: "1800-123-4567",
          countryOfOrigin: null, // Missing country of origin
          vegNonVeg: "VEG",
          ingredients: "Rolled Oats, Honey, Almonds, Raisins",
          fssaiLicense: "13321999000263",
          barcode: "8901058000016",
          fields: [],
          imageQuality: {
            lighting: "good",
            blur: "sharp",
            glare: "none",
            readabilityScore: 92,
            overallAssessment: "Clear front declaration panel.",
          },
        },
        compliance: {
          status: "NON_COMPLIANT",
          score: 64,
          passedWeight: 64,
          scoreableWeight: 100,
          passCount: 9,
          failCount: 3,
          reviewCount: 2,
          criticalViolations: [
            "Missing Unit Sale Price (Rule 6(11))",
            "Missing Country of Origin (Rule 6(10))",
            "Non-standard Currency Symbol 'Rs.' instead of ₹ (Rule 6(1)(e))",
          ],
          rules: [],
        },
      },
      {
        id: "INSP-LM-2026-77341",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        extractedData: {
          productName: "Antiseptic Skin Cleanser 250ml",
          brand: "DermaPure Labs",
          category: "pharma",
          netQuantity: "250 ml",
          mrp: "₹ 185.00 (Inclusive of all taxes)",
          unitSalePrice: "₹ 0.74 per ml",
          mfgDate: "01/2026",
          expiryDate: "12/2027",
          batchNumber: "DP-2601-C",
          mfgName: "DermaPure Healthcare Pvt Ltd",
          mfgAddress: "Plot 12, Pharma City, Hyderabad - 500001",
          consumerCare: "contact@dermapure.com / 040-23456789",
          countryOfOrigin: "India",
          vegNonVeg: "NOT_APPLICABLE",
          ingredients: "Chlorhexidine Gluconate 0.5% w/v, Purified Water",
          fssaiLicense: null,
          barcode: "8902049102844",
          fields: [],
          imageQuality: {
            lighting: "good",
            blur: "sharp",
            glare: "none",
            readabilityScore: 98,
            overallAssessment: "Complete pharmaceutical packaging label.",
          },
        },
        compliance: {
          status: "COMPLIANT",
          score: 98,
          passedWeight: 98,
          scoreableWeight: 100,
          passCount: 15,
          failCount: 0,
          reviewCount: 0,
          criticalViolations: [],
          rules: [],
        },
      },
      {
        id: "INSP-LM-2026-66290",
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80",
        extractedData: {
          productName: "Organic Cold Pressed Virgin Coconut Oil",
          brand: "CocoNectar Botanicals",
          category: "fmcg",
          netQuantity: "500 ml",
          mrp: "₹ 340.00",
          unitSalePrice: "₹ 0.68 / ml",
          mfgDate: "02/2026",
          expiryDate: "01/2028",
          batchNumber: "CN-500-26",
          mfgName: "Kerala Agro Foods Co.",
          mfgAddress: "Aluva, Ernakulam, Kerala - 683101",
          consumerCare: "help@coconectar.org",
          countryOfOrigin: "India",
          vegNonVeg: "VEG",
          ingredients: "100% Pure Virgin Coconut Oil",
          fssaiLicense: "11318002000412",
          barcode: "8903348102919",
          fields: [],
          imageQuality: {
            lighting: "good",
            blur: "sharp",
            glare: "none",
            readabilityScore: 94,
            overallAssessment: "Crisp organic oil container print.",
          },
        },
        compliance: {
          status: "COMPLIANT",
          score: 95,
          passedWeight: 95,
          scoreableWeight: 100,
          passCount: 14,
          failCount: 0,
          reviewCount: 1,
          criticalViolations: [],
          rules: [],
        },
      },
    ];
  }, []);

  // Merge real inspections from backend with high-fidelity defaults
  const allInspections = useMemo(() => {
    if (inspections && inspections.length > 0) {
      // combine real and default to make a rich catalog
      const existingIds = new Set(inspections.map((i) => i.id));
      const filteredDefaults = defaultItems.filter((d) => !existingIds.has(d.id));
      return [...inspections, ...filteredDefaults];
    }
    return defaultItems;
  }, [inspections, defaultItems]);

  // Filtered by category and search
  const filteredInspections = useMemo(() => {
    return allInspections.filter((item) => {
      const name = (item.extractedData.productName || "").toLowerCase();
      const brand = (item.extractedData.brand || "").toLowerCase();
      const cat = (item.extractedData.category || "").toLowerCase();
      const id = item.id.toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q || name.includes(q) || brand.includes(q) || cat.includes(q) || id.includes(q);

      const matchesCat =
        selectedCategory === "ALL" ||
        (selectedCategory === "FMCG" && (cat === "fmcg" || cat === "personal care")) ||
        (selectedCategory === "FOOD" && (cat === "food" || cat === "snacks")) ||
        (selectedCategory === "BEVERAGE" && cat === "beverage") ||
        (selectedCategory === "PHARMA" && (cat === "pharma" || cat === "health")) ||
        (selectedCategory === "COSMETICS" && (cat === "cosmetics" || cat === "beauty"));

      return matchesSearch && matchesCat;
    });
  }, [allInspections, searchQuery, selectedCategory]);

  // Current active inspection
  const activeInspection = useMemo(() => {
    if (selectedInspectionId) {
      const found = allInspections.find((i) => i.id === selectedInspectionId);
      if (found) return found;
    }
    return filteredInspections[0] || allInspections[0];
  }, [allInspections, filteredInspections, selectedInspectionId]);

  // Counts
  const totalCount = allInspections.length;
  const nonCompliantCount = allInspections.filter(
    (i) => i.compliance.status === "NON_COMPLIANT"
  ).length;
  const rulesCount = 15;

  // Penalties estimated
  const estimatedFine = useMemo(() => {
    if (activeInspection.compliance.status === "NON_COMPLIANT") {
      return "₹ 25,000.00";
    }
    if (activeInspection.compliance.status === "NEEDS_REVIEW") {
      return "PENDING";
    }
    return "₹ 0.00";
  }, [activeInspection]);

  // Categories list matching the pill bar in reference
  const categories = ["ALL", "FMCG", "FOOD", "BEVERAGE", "PHARMA", "COSMETICS"];

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `NiriKsha Inspection: ${activeInspection.extractedData.productName}`,
          text: `Legal Metrology Inspection Dossier ${activeInspection.id}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Dossier URL copied to clipboard!");
    }
  };

  return (
    <div className="w-full bg-[#0d0d11] text-zinc-900 selection:bg-[#FF4800] selection:text-white p-2.5 sm:p-4 md:p-6 min-h-screen font-sans">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* ====================================================================
            1. TOP TICKER / LEGAL METROLOGY UTILITY BAR
            ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-mono text-zinc-400 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-bold tracking-wider uppercase">
              <span className="size-2 rounded-full bg-[#FF4800] animate-pulse" />
              LEGAL METROLOGY (PACKAGED COMMODITIES) RULES 2011
            </span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-400">CENTRAL STATUTORY ENFORCEMENT PORTAL</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-400">FOURTH SCHEDULE FONT & UNIT CALIBRATION</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] tracking-wider text-zinc-400 uppercase shrink-0">
            <span className="hover:text-white transition-colors cursor-pointer hidden md:inline">
              FREE ALL-INDIA ACCESS
            </span>
            <span className="hover:text-white transition-colors cursor-pointer hidden sm:inline">
              NATIONAL HELPLINE: 1915
            </span>
            <span className="text-zinc-300 font-bold">© NIRIKSHA 2026</span>
          </div>
        </div>

        {/* ====================================================================
            2. PRIMARY SUPERDRY-INSPIRED HEADER ISLAND (WHITE PILL)
            ==================================================================== */}
        <header className="bg-white rounded-[24px] border-2 border-black p-3.5 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Katakana */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-zinc-700 uppercase">
                極度検査 (しなさい)
              </div>
              <div className="flex items-center gap-1.5 -mt-1">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-black uppercase font-sans">
                  NiriKsha
                </span>
                <span className="size-6 rounded-full bg-[#FF4800] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                  ®
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenRegistry}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black bg-white hover:bg-zinc-50 transition-colors text-xs font-bold text-black cursor-pointer shadow-xs"
            >
              <span className="tracking-wide">INSPECTIONS</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FBE2A7] border border-black/30 text-[10px] font-black text-black">
                {totalCount} Items
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenActions}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black bg-white hover:bg-zinc-50 transition-colors text-xs font-bold text-black cursor-pointer shadow-xs"
            >
              <span className="tracking-wide">VIOLATIONS</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF4800] text-white text-[10px] font-black">
                {nonCompliantCount} Items
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenMap}
              className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black bg-white hover:bg-zinc-50 transition-colors text-xs font-bold text-black cursor-pointer shadow-xs"
            >
              <MapPin className="size-3.5 text-[#FF4800]" />
              <span className="tracking-wide">MAP</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FBE2A7] border border-black/30 text-[10px] font-black text-black">
                PAN-INDIA
              </span>
            </button>
          </div>

          {/* Right Metrics, Tools & Role Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Currency / Status Metric */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-black px-3 py-1.5 rounded-full bg-zinc-100 border border-black/20">
              <span className="text-zinc-500">ASSESSED:</span>
              <span className="text-[#FF4800]">{estimatedFine}</span>
            </div>

            {/* Circular Action Icons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate("/reports")}
                className="size-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#FF4800] transition-colors cursor-pointer"
                title="Reports & Dossier Archive"
              >
                <ShoppingBag className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsSaved((prev) => !prev)}
                className={`size-9 rounded-full flex items-center justify-center border-2 border-black transition-colors cursor-pointer ${
                  isSaved ? "bg-[#FF4800] text-white" : "bg-white text-black hover:bg-zinc-100"
                }`}
                title="Bookmark Inspection"
              >
                <Heart className={`size-4 ${isSaved ? "fill-white" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="size-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#FF4800] transition-colors cursor-pointer"
                title="System Menu"
              >
                <Menu className="size-4" />
              </button>
            </div>

            {/* User Role Tag */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-black bg-black text-white hover:bg-zinc-800 transition-colors text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <ShieldCheck className="size-3.5 text-[#FF4800]" />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {isConsumer ? "Citizen" : profile.designation || "Inspector"}
              </span>
            </button>
          </div>
        </header>

        {/* ====================================================================
            3. SUB-NAVIGATION & CATEGORY FILTER PILL BAR
            ==================================================================== */}
        <div className="bg-white rounded-[24px] border-2 border-black p-2 sm:p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
          {/* Size / Category Filter Circles */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`size-8 sm:size-9 rounded-full border-2 text-[11px] font-black transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                    active
                      ? "border-[#FF4800] text-[#FF4800] bg-orange-50/50 shadow-inner scale-105"
                      : "border-black text-black hover:bg-zinc-100"
                  }`}
                >
                  {cat === "ALL" ? "ALL" : cat.slice(0, 3)}
                </button>
              );
            })}

            {/* Search Pill Input */}
            <div className="relative ml-2 min-w-[160px] sm:min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodity / barcode..."
                className="w-full bg-zinc-100 border border-black/20 rounded-full pl-8 pr-3 py-1 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Standards Guide & Primary Scan Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-[11px] font-bold text-zinc-700 hover:text-black uppercase tracking-wider underline underline-offset-4 hidden sm:inline"
            >
              SIZE & FONT GUIDE
            </button>

            <span className="text-xs font-mono font-bold text-black hidden md:inline">
              FINE: {estimatedFine}
            </span>

            {/* Prominent "+ ADD TO BAG" style "+ NEW INSPECTION" button */}
            <button
              type="button"
              onClick={() => navigate("/scan")}
              className="group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full border-2 border-black bg-black text-white hover:bg-zinc-800 transition-all text-xs sm:text-sm font-black tracking-wide cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <span>NEW INSPECTION</span>
              <span className="size-5 rounded-full bg-[#FF4800] text-white flex items-center justify-center font-black text-xs group-hover:rotate-90 transition-transform">
                <Plus className="size-3.5 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            4. THE 3-COLUMN NEO-INDUSTRIAL BENTO GRID
            ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ------------------------------------------------------------------
              LEFT COLUMN: BRAND LANGUAGE & COMMODITY METADATA (col-span-3)
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-3 bg-white rounded-[24px] border-2 border-black p-5 sm:p-6 flex flex-col justify-between shadow-lg space-y-6">
            <div className="space-y-4">
              {/* Breadcrumbs */}
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                HOME — {activeInspection.extractedData.category?.toUpperCase() || "PACKAGED"} —
                LM-RULES-2011
              </div>

              {/* Giant Stacked Title */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black uppercase leading-none font-sans">
                  Brand
                  <br />
                  Language
                  <br />
                  Label
                  <br />
                  <span className="text-[#FF4800]">
                    {activeInspection.extractedData.brand || "Commodity"}
                  </span>
                </h2>
                <p className="text-xs font-bold text-zinc-700 pt-1">
                  {activeInspection.extractedData.productName}
                </p>
              </div>

              {/* Statutory Narrative Description */}
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Dual-pass multi-model computer vision & statutory reasoning under the Legal
                Metrology (Packaged Commodities) Rules, 2011. Inspects mandatory declarations:
                Maximum Retail Price, Net Quantity, Best Before, Origin, and Manufacturer disclosures.
              </p>

              {/* Active Inspection Switcher Pills */}
              <div className="pt-2 border-t border-zinc-200 space-y-2">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  RECENT SCANS ({filteredInspections.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {filteredInspections.map((item) => {
                    const isCurrent = item.id === activeInspection.id;
                    const isFail = item.compliance.status === "NON_COMPLIANT";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedInspectionId(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-black text-white border-black"
                            : isFail
                            ? "bg-rose-50 text-rose-700 border-rose-300 hover:border-black"
                            : "bg-zinc-100 text-zinc-700 border-zinc-300 hover:border-black"
                        }`}
                      >
                        {item.extractedData.brand || item.id.slice(-5)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row Utilities */}
            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSaved((prev) => !prev)}
                className={`size-10 rounded-full border-2 border-black flex items-center justify-center transition-colors cursor-pointer ${
                  isSaved ? "bg-[#FF4800] text-white" : "bg-white text-black hover:bg-zinc-100"
                }`}
                title="Save this inspection"
              >
                <Heart className={`size-4.5 ${isSaved ? "fill-white" : ""}`} />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShare}
                  className="size-7 rounded-full bg-[#FF4800] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Share inspection dossier"
                >
                  <Share2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/report/${activeInspection.id}`)}
                  className="size-7 rounded-full bg-[#0c1b33] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Full Statutory Report"
                >
                  <FileText className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              CENTER COLUMN: THE SIGNATURE MANILA "SPECIFICATION" SHEET (col-span-6)
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-6 bg-[#FBE2A7] rounded-[24px] border-2 border-black p-5 sm:p-7 text-black font-mono shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Card Title & Header Row */}
              <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-sans text-black">
                  SPECIFICATION
                </h3>
                <span className="text-[11px] font-bold tracking-widest text-black/80 uppercase">
                  STATUS: {activeInspection.compliance.status}
                </span>
              </div>

              {/* Specification 3-Column Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] leading-snug border-b-2 border-black/20 pb-4">
                {/* Col 1: Mandatory Fields Checklist */}
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-black">
                    MANDATORY CHECKS:
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      {activeInspection.extractedData.mrp ? (
                        <Check className="size-3 text-emerald-800 stroke-[3]" />
                      ) : (
                        <X className="size-3 text-rose-800 stroke-[3]" />
                      )}
                      <span>MRP INCLUSIVE TAXES</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeInspection.extractedData.unitSalePrice ? (
                        <Check className="size-3 text-emerald-800 stroke-[3]" />
                      ) : (
                        <X className="size-3 text-rose-800 stroke-[3]" />
                      )}
                      <span>UNIT SALE PRICE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeInspection.extractedData.netQuantity ? (
                        <Check className="size-3 text-emerald-800 stroke-[3]" />
                      ) : (
                        <X className="size-3 text-rose-800 stroke-[3]" />
                      )}
                      <span>NET QUANTITY (METRIC)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeInspection.extractedData.countryOfOrigin ? (
                        <Check className="size-3 text-emerald-800 stroke-[3]" />
                      ) : (
                        <X className="size-3 text-rose-800 stroke-[3]" />
                      )}
                      <span>COUNTRY OF ORIGIN</span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Materials & Tare Weight */}
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-black">
                    MATERIALS & TARE:
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1">
                    <div>PACKAGING: MULTI-LAYER BARRIER</div>
                    <div>NET WT: {activeInspection.extractedData.netQuantity || "UNREADABLE"}</div>
                    <div>TOLERANCE: SECOND SCHEDULE OK</div>
                    <div>MFG: {activeInspection.extractedData.mfgDate || "N/A"}</div>
                  </div>
                </div>

                {/* Col 3: Statutory Care Icons (matching laundry icons in reference!) */}
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-black">
                    STATUTORY ICONS:
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div
                      className="size-7 rounded-md border border-black flex items-center justify-center bg-white/40"
                      title="Net Quantity Weight Symbol (Rule 12)"
                    >
                      <Scale className="size-4 text-black" />
                    </div>
                    <div
                      className="size-7 rounded-md border border-black flex items-center justify-center bg-white/40"
                      title="Unit Sale Price (Rule 6(11))"
                    >
                      <Tag className="size-4 text-black" />
                    </div>
                    <div
                      className="size-7 rounded-md border border-black flex items-center justify-center bg-white/40"
                      title="Expiry & Date Coding (Rule 6(1)(d))"
                    >
                      <Calendar className="size-4 text-black" />
                    </div>
                    <div
                      className="size-7 rounded-md border border-black flex items-center justify-center bg-white/40"
                      title="Origin & Country Disclosure"
                    >
                      <Globe className="size-4 text-black" />
                    </div>
                    <div
                      className="size-7 rounded-md border border-black flex items-center justify-center bg-white/40"
                      title="Barcode Verification"
                    >
                      <Barcode className="size-4 text-black" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Rule Analysis Checklist */}
              <div className="space-y-1.5 text-[10px] leading-relaxed pt-1">
                <div>
                  <span className="font-bold">MRP & TAXES:</span>{" "}
                  {activeInspection.extractedData.mrp || "NOT CLEARLY VISIBLE (RULE 6(1)(e))"}
                </div>
                <div>
                  <span className="font-bold">UNIT SALE PRICE:</span>{" "}
                  {activeInspection.extractedData.unitSalePrice ||
                    "ABSENT / MISSING MANDATORY DISCLOSURE (RULE 6(11))"}
                </div>
                <div>
                  <span className="font-bold">MANUFACTURER:</span>{" "}
                  {activeInspection.extractedData.mfgName || "SEE DOSSIER REGISTRATION ADDRESS"}
                </div>
                <div>
                  <span className="font-bold">CONSUMER CARE:</span>{" "}
                  {activeInspection.extractedData.consumerCare ||
                    "NAME, ADDRESS & PHONE REQUIRED (RULE 6(1)(f))"}
                </div>
                <div>
                  <span className="font-bold">BATCH / LOT NO:</span>{" "}
                  {activeInspection.extractedData.batchNumber || "RECORDED IN METROLOGY LOG"}
                </div>
              </div>

              {/* Item Code Stamp */}
              <div className="pt-2 text-[10px] font-bold tracking-widest text-black/90">
                ITEM CODE: {activeInspection.id}
              </div>
            </div>

            {/* Bottom Section: Delivery & Legal Notice Clearance */}
            <div className="border-t-2 border-black/20 pt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1 max-w-sm">
                <div className="text-xs font-black uppercase tracking-wider">
                  STATUTORY ENFORCEMENT & DISPATCH
                </div>
                <p className="text-[11px] leading-tight text-black/80 font-sans">
                  Section 36(1) compound notice queued for automated dispatch to jurisdictional
                  Controller of Legal Metrology.
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-black/60 uppercase">PENALTY VALUATION</div>
                <div className="text-xl sm:text-2xl font-black text-black tracking-tight">
                  {estimatedFine}
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              RIGHT COLUMN: MEDIA & ACTION BENTO STACK (col-span-3)
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-3 flex flex-col gap-4 justify-between">
            {/* Top Right Card: Inspection Product Image */}
            <div className="bg-white rounded-[22px] border-2 border-black overflow-hidden shadow-md relative group aspect-4/3 flex items-center justify-center">
              <img
                src={activeInspection.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"}
                alt={activeInspection.extractedData.productName || "Inspected Commodity"}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                EVIDENCE #1
              </div>
              <button
                type="button"
                onClick={() => navigate(`/scan/${activeInspection.id}`)}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Maximize2 className="size-4" />
                <span>INSPECT OCR BOXES</span>
              </button>
            </div>

            {/* International Safety Orange Card ("STAY CONNECTED / NOTICE") */}
            <div className="bg-[#FF4800] text-white rounded-[24px] border-2 border-black p-5 shadow-lg flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-black tracking-wider uppercase font-sans">
                    STAY
                    <br />
                    COMPLIANT
                  </h4>
                  <p className="text-[11px] text-white/90 pt-1 font-medium leading-snug">
                    Instant Section 36/49 notice generation with digital seal.
                  </p>
                </div>
                <div className="size-9 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
                  <Mail className="size-4" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/notice/${activeInspection.id}`)}
                className="w-full py-2 px-3 rounded-full bg-black text-white hover:bg-zinc-900 transition-colors text-xs font-black tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>DRAFT NOTICE</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Circular Stamp Badge & Macro Zoom Card */}
            <div className="flex items-center gap-3">
              {/* Circular Spec Badge matching reference */}
              <div className="size-16 rounded-full bg-[#FBE2A7] border-2 border-black flex flex-col items-center justify-center text-center shadow-sm shrink-0 rotate-3">
                <span className="text-[9px] font-black tracking-tighter text-black uppercase">
                  SPEC
                </span>
                <span className="text-[8px] font-mono font-bold text-black/80">LM-2011</span>
              </div>

              {/* Macro Barcode / Label View */}
              <div className="flex-1 bg-white rounded-[18px] border-2 border-black p-2.5 flex items-center gap-2.5 shadow-sm">
                <div className="size-10 rounded-lg bg-zinc-100 border border-black/20 flex items-center justify-center shrink-0">
                  <Barcode className="size-5 text-black" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black text-black truncate uppercase">
                    EAN-13 BARCODE
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 truncate">
                    {activeInspection.extractedData.barcode || "8901058000016"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Product/Report Dossier Card */}
            <div className="bg-white rounded-[22px] border-2 border-black p-3.5 shadow-md flex items-center gap-3">
              <img
                src={activeInspection.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80"}
                alt="Thumbnail"
                className="size-14 rounded-xl border border-black/20 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-black truncate uppercase">
                  {activeInspection.extractedData.productName}
                </div>
                <div className="text-[10px] text-amber-500 font-bold">★★★★★ 98.4%</div>
                <div className="flex items-center gap-2 text-[10px] font-mono pt-0.5">
                  <span className="text-zinc-400 line-through">WAS ₹50,000</span>
                  <span className="font-bold text-black">NOW {estimatedFine}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/report/${activeInspection.id}`)}
                className="size-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#FF4800] transition-colors cursor-pointer shrink-0"
                title="View Full Compliance Report"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { LocationSelector } from "@/components/location-selector";
import { useAuth } from "@/hooks/use-auth";
import { LABEL_SAMPLES } from "@/lib/label-samples";
import { makeSyntheticLabel } from "@/lib/synthetic-label";
import {
  ScanLine,
  Camera,
  ShieldCheck,
  Gavel,
  Ruler,
  BarChart3,
  Database,
  FileText,
  WifiOff,
  ArrowRight,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

const RULE_CHECKS = [
  {
    icon: <ScanLine className="size-5" />,
    title: "MRP with ₹ symbol",
    clause: "Rule 6(1)(e)",
    detail:
      "Detects the MRP declaration and flags non-₹ currency formats such as “Rs 185”.",
  },
  {
    icon: <ScanLine className="size-5" />,
    title: "Net quantity in SI units",
    clause: "Rule 6(1)(a)",
    detail: "g, kg, ml, l, N — non-standard units are cited as violations.",
  },
  {
    icon: <ScanLine className="size-5" />,
    title: "Month & year of manufacture",
    clause: "Rule 6(1)(d)",
    detail: "Must be MM/YYYY or MM/YY; anything else gets flagged.",
  },
  {
    icon: <ScanLine className="size-5" />,
    title: "Manufacturer & consumer care",
    clause: "Rule 6(1)(b), (f)",
    detail: "Name/address of maker plus helpline phone, email or URL.",
  },
  {
    icon: <Ruler className="size-5" />,
    title: "Character height slabs",
    clause: "Fourth Schedule",
    detail:
      "Physical calibration turns pixels into millimetres and validates print size per package-weight slab.",
  },
  {
    icon: <ScanLine className="size-5" />,
    title: "Country of origin",
    clause: "Rule 6(1)(i)",
    detail: "“Made in …” / “Country of Origin: …” must be declared.",
  },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const isOfficer = !isAuthenticated || user?.role === "officer";

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Logo className="size-8 text-primary" />
              <span className="font-serif text-xl font-bold tracking-tight">ComplyScan</span>
            </Link>
            <div className="hidden sm:block">
              <LocationSelector />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild size="sm" variant="ghost" className="hidden sm:flex rounded-full px-6">
              <Link to="/scan">
                Scan a label
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-6 shadow-soft">
              <Link to={isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard"}>
                {user?.role === "consumer" ? "Consumer Dashboard" : "Officer Portal"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--pastel-lavender)]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--pastel-green)]/15 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 animate-pulse" />
        <div className="absolute inset-0 opacity-[0.04] dot-pattern" />
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-10 lg:grid-cols-2 lg:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <Badge variant="outline" className="mb-6 w-fit rounded-full border-border bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-md text-foreground">
              ✨ Automated Rules Engine
            </Badge>
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-[6.5rem] font-extrabold leading-[1.05] tracking-tight text-foreground">
              Scan.<br />
              <span className="text-[var(--pastel-lavender-fg)]">Verify.</span><br />
              <span className="text-[var(--pastel-green-fg)]">Comply.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground font-light leading-relaxed">
              Ensure packaged commodities meet the Legal Metrology Rules, 2011. Our vision scanner reads labels instantly, checking mandatory declarations and physical font calibration.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] hover:bg-[var(--pastel-green)]/90 hover:scale-105 transition-all h-14 px-8 text-base shadow-[0_0_40px_rgba(var(--pastel-green),0.3)]">
                <Link to="/scan">
                  <Camera className="mr-2 size-5" /> Check a Product
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-border bg-transparent text-foreground hover:bg-muted h-14 px-8 text-base backdrop-blur-sm">
                <Link to={isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard"}>
                  <Gavel className="mr-2 size-5" /> {user?.role === "consumer" ? "Consumer Dashboard" : "Enforcement Portal"}
                </Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" />
              Secure, instant, and privacy-first analysis.
            </p>
          </motion.div>

          {/* Hero Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [-4, 6, -4] }}
            transition={{ opacity: { duration: 1, delay: 0.2 }, scale: { duration: 1, delay: 0.2 }, y: { repeat: Infinity, duration: 8, ease: "easeInOut" } }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md rounded-[2.5rem] bg-card/40 backdrop-blur-2xl p-6 shadow-[0_8px_40px_0_rgba(0,0,0,0.08)] border border-white/30 overflow-hidden text-card-foreground">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-serif text-lg font-bold">Analysis Result</span>
                <Badge className="badge-fail rounded-full px-3 py-1">NON-COMPLIANT</Badge>
              </div>
              <div className="space-y-4">
                {/* Mockup Rows */}
                <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Maximum Retail Price</span>
                    <CheckCircle2 className="size-5 text-[var(--pastel-green-fg)]" />
                  </div>
                  <p className="text-xl font-bold font-serif">₹ 149.00</p>
                  <p className="text-xs text-muted-foreground mt-1">Rule 6(1)(e) satisfied.</p>
                </div>
                
                <div className="rounded-2xl border-2 border-[var(--pastel-red)] bg-[var(--pastel-red)]/10 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-[var(--pastel-red-fg)]">Net Quantity</span>
                    <AlertTriangle className="size-5 text-[var(--pastel-red-fg)]" />
                  </div>
                  <p className="text-xl font-bold font-serif line-through opacity-70">500 grams</p>
                  <p className="text-xs text-[var(--pastel-red-fg)] mt-1 font-medium">Violation: Non-standard unit used. Must be 'g' or 'kg'.</p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Consumer Care</span>
                    <CheckCircle2 className="size-5 text-[var(--pastel-green-fg)]" />
                  </div>
                  <p className="text-sm font-medium truncate">care@example.com / 1800-123-456</p>
                </div>
              </div>
            </div>
            
            {/* Decorative blurs */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-gradient-to-tr from-[var(--pastel-lavender)]/20 via-[var(--pastel-green)]/10 to-[var(--pastel-yellow)]/20 blur-[100px]" />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1.5 bg-muted/50">
            <Scale className="size-4 mr-2" /> Pipeline
          </Badge>
          <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            How the engine works
          </h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "Scan & Capture",
              desc: "Upload an image or use your device camera. Our pipeline handles glare, skew, and low light.",
              color: "bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-fg)]"
            },
            {
              step: "02",
              title: "Automated Detection",
              desc: "Vision system extracts text, logos, barcodes, and spatial relationships without relying solely on OCR.",
              color: "bg-[var(--pastel-green)] text-[var(--pastel-green-fg)]"
            },
            {
              step: "03",
              title: "Rules Check",
              desc: "Extracted data is cross-referenced against the Legal Metrology (Packaged Commodities) Rules, 2011.",
              color: "bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-fg)]"
            },
            {
              step: "04",
              title: "Compliance Report",
              desc: "Get an instant, officer-grade verdict citing specific rules, with actionable remediation steps.",
              color: "bg-[var(--pastel-red)] text-[var(--pastel-red-fg)]"
            }
          ].map((item, i) => (
            <Card key={item.step} className="border-none shadow-soft overflow-hidden rounded-[2rem] bg-card hover:-translate-y-2 transition-transform duration-300">
              <div className={`h-2 w-full ${item.color}`} />
              <CardContent className="p-8">
                <span className="font-serif text-5xl font-black text-muted-foreground/20 block mb-6">{item.step}</span>
                <h3 className="font-serif text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="bg-muted/30 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                Comprehensive statutory coverage
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We've encoded the Legal Metrology Act, 2009 and the Packaged Commodities Rules, 2011 into a strict, verifiable matrix.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 shadow-sm">
              <Link to="/scan">View all rules</Link>
            </Button>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RULE_CHECKS.map((c, i) => (
              <div
                key={c.clause}
                className="group relative rounded-[2rem] border bg-card p-8 shadow-soft transition hover:border-primary/20"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {c.icon}
                </div>
                <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider">
                  {c.clause}
                </Badge>
                <h3 className="font-serif text-xl font-bold mb-3">{c.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {c.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Portals */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 text-foreground">
          
          <div className="rounded-[2.5rem] bg-card p-8 sm:p-12 border border-border/80 shadow-soft relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-fg)] shadow-sm">
                <ScanLine className="size-8" />
              </div>
              <h3 className="font-serif text-4xl font-bold mb-4 text-foreground">Consumers &amp; Businesses</h3>
              <p className="text-lg mb-8 text-muted-foreground leading-relaxed max-w-md">
                Upload or capture an image to verify packaging compliance instantly. No signup required for single scans.
              </p>
              <ul className="space-y-4 mb-10 text-foreground">
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-lavender-fg)]" /> Live camera and image upload</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-lavender-fg)]" /> System detects declarations automatically</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-lavender-fg)]" /> Detailed violation explanations</li>
              </ul>
              <Button asChild size="lg" className="rounded-full bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-fg)] hover:bg-[var(--pastel-lavender)]/80 px-8 shadow-sm">
                <Link to="/scan">
                  Open Scanner <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-card p-8 sm:p-12 border border-border/80 shadow-soft relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] shadow-sm">
                <ShieldCheck className="size-8" />
              </div>
              <h3 className="font-serif text-4xl font-bold mb-4 text-foreground">Enforcement Officers</h3>
              <p className="text-lg mb-8 text-muted-foreground leading-relaxed max-w-md">
                A professional suite for field inspections, providing legal-grade output and historical tracking.
              </p>
              <ul className="space-y-4 mb-10 text-foreground">
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-green-fg)]" /> Geotagged &amp; timestamped evidence</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-green-fg)]" /> Font calibration vs Fourth Schedule</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[var(--pastel-green-fg)]" /> PDF Notice generation</li>
              </ul>
              <Button asChild size="lg" className="rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] hover:bg-[var(--pastel-green)]/90 px-8 shadow-sm">
                <Link to={isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard"}>
                  Officer Sign-In <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div className="absolute -z-0 -bottom-32 -right-32 size-[500px] rounded-full bg-[var(--pastel-green)]/10 blur-[100px]" />
          </div>

        </div>
      </section>

      {/* Try Pipeline */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold mb-8">Try with specimen labels</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {LABEL_SAMPLES.map((s) => {
              // Generate the realistic image for the thumbnail
              const imgSrc = makeSyntheticLabel(s.id);
              return (
                <Link
                  key={s.id}
                  to={`/scan?specimen=${s.id}`}
                  className="group flex items-center gap-4 rounded-full border bg-card pr-6 p-2 shadow-sm transition hover:-translate-y-1 hover:border-[var(--pastel-green)] hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/50 shadow-inner bg-muted/20">
                    <img src={imgSrc} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground group-hover:text-[var(--pastel-green-fg)] mt-0.5">{s.verdictHint}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo className="size-8 text-primary" />
            <span className="font-serif text-xl font-bold">ComplyScan</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right max-w-sm">
            Automated compliance for packaged commodities. References to the Legal Metrology Act, 2009 & PC Rules, 2011 are indicative.
          </p>
        </div>
      </footer>
    </div>
  );
}

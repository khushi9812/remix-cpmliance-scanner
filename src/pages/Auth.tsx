import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import logo from "@/assets/logo.svg";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Removed auto-redirect so you can view the login page design even if already authenticated
  // useEffect(() => {
  //   if (!authLoading && isAuthenticated) {
  //     navigate(redirect);
  //   }
  // }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      console.log("signed in");

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting anonymous sign in...");
      await signIn("anonymous");
      console.log("Anonymous sign in successful");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("inspector");

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background shapes for modern SaaS look */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--pastel-lavender)]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--pastel-green)]/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3" />

      {/* Auth Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
            <div className="bg-foreground p-1.5 rounded-xl">
              <img src={logo} alt="Logo" width={28} height={28} className="invert" />
            </div>
            <span className="font-serif text-3xl font-bold tracking-tight text-foreground">ComplyScan</span>
          </Link>
          <p className="text-muted-foreground font-medium">Welcome Back</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Please enter your credentials to access the portal.</p>
        </div>

        <Card className="w-full max-w-[420px] shadow-2xl border-white/20 bg-card/80 backdrop-blur-xl rounded-[2rem] overflow-hidden p-2 sm:p-3">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-1 mb-2">
              <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1.5 rounded-2xl h-14">
                <TabsTrigger 
                  value="inspector" 
                  className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground font-bold transition-all h-full text-base"
                >
                  Inspector
                </TabsTrigger>
                <TabsTrigger 
                  value="consumer" 
                  className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground font-bold transition-all h-full text-base"
                >
                  Consumer
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="inspector" className="m-0 focus-visible:outline-none">
              {step === "signIn" ? (
                <form onSubmit={handleEmailSubmit}>
                  <CardContent className="pt-6 pb-8 px-6 sm:px-8 space-y-5">
                    
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        Inspector ID / Email
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                        <Input
                          name="email"
                          placeholder="inspector@gov.in"
                          type="email"
                          className="pl-10 h-12 rounded-xl bg-background border-border/60 focus:bg-background"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                          Password
                        </label>
                        <a href="#" className="text-[11px] font-semibold text-[var(--pastel-lavender-fg)] hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                        <Input
                          name="password"
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10 h-12 rounded-xl bg-background border-border/60 focus:bg-background"
                          disabled={isLoading}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="keep-logged" className="rounded border-border text-foreground focus:ring-foreground size-3.5" />
                      <label htmlFor="keep-logged" className="text-sm font-medium text-foreground cursor-pointer">
                        Keep me logged in
                      </label>
                    </div>

                    {error && (
                      <p className="text-sm text-[var(--pastel-pink-fg)] bg-[var(--pastel-pink)]/20 p-2 rounded-lg text-center font-medium">
                        {error}
                      </p>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 mt-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold shadow-md transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center">
                          Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>

                  </CardContent>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pt-6 pb-8 px-6 sm:px-8">
                    <div className="text-center mb-6">
                      <h3 className="font-serif text-xl font-bold mb-1">Verify Identity</h3>
                      <p className="text-sm text-muted-foreground">
                        Code sent to {step.email}
                      </p>
                    </div>

                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center mb-6">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup className="gap-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border-border/60 bg-muted/30 font-bold text-lg" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {error && (
                      <p className="text-sm text-[var(--pastel-pink-fg)] text-center mb-4 font-medium">
                        {error}
                      </p>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold shadow-md"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("signIn")}
                        disabled={isLoading}
                        className="w-full h-10 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                      >
                        Use different email
                      </Button>
                    </div>
                  </CardContent>
                </form>
              )}
            </TabsContent>

            <TabsContent value="consumer" className="m-0 focus-visible:outline-none">
              <CardContent className="pt-6 pb-8 px-6 sm:px-8">
                <div className="text-center mb-6">
                  <div className="size-12 rounded-full bg-[var(--pastel-green)]/20 text-[var(--pastel-green-fg)] flex items-center justify-center mx-auto mb-4">
                    <UserX className="size-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2">Consumer Access</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Citizens can instantly check product compliance without an account. Access the public portal to scan labels.
                  </p>
                </div>
                
                <Button
                  type="button"
                  className="w-full h-12 rounded-xl bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] hover:bg-[var(--pastel-green)]/90 font-bold shadow-soft transition-all"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Direct Login as Consumer"
                  )}
                </Button>
              </CardContent>
            </TabsContent>

          </Tabs>
        </Card>
        
        <p className="text-xs text-muted-foreground/60 mt-8">
          Authorized inspection personnel only.<br/>
          ComplyScan — SIH Prototype 2026
        </p>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}

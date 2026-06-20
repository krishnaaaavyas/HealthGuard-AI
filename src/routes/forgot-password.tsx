import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLanguage, tr } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeartPulse, Loader2, Mail, ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const currentLang = useLanguage();
  useEffect(() => {
    document.title = `${tr("forgotPasswordTitle", currentLang)} — HealthGuard`;
  }, [currentLang]);

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // toast is already handled inside AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="text-left leading-tight">
              <div className="font-display text-xl font-bold tracking-tight text-foreground">
                HealthGuard
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                AI Health Intelligence
              </div>
            </div>
          </Link>
          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground">
            {tr("resetPasswordTitle", currentLang)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("regainAccess", currentLang)}</p>
        </div>

        <Card className="border-border bg-surface shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">
              {tr("forgotPasswordTitle", currentLang)}
            </CardTitle>
            <CardDescription>
              {sent ? tr("sentRecoveryDesc", currentLang) : tr("enterRecoveryDesc", currentLang)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="rounded-lg border border-teal/20 bg-accent/30 p-4 text-center text-sm text-accent-foreground">
                {tr("inboxInstructions", currentLang)}
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{tr("emailAddress", currentLang)}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tr("sending", currentLang)}
                    </>
                  ) : (
                    <>
                      {tr("sendRecoveryLink", currentLang)} <Send className="ml-2 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3 border-t border-border pt-4 text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-teal hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> {tr("backToSignIn", currentLang)}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

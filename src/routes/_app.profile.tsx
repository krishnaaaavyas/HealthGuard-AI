import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ArrowLeft,
  LogOut,
  Mail,
  User as UserIcon,
  Shield,
  FileText,
  Activity,
  ClipboardList,
} from "lucide-react";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ProfilePage() {
  useEffect(() => {
    document.title = "User Profile — HealthGuard";
  }, []);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assessmentStatus, setAssessmentStatus] = useState<{
    hasCompletedAssessment: boolean;
    lastAssessmentUpdate: string | null;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        let idToken = "mock-uid-guest";
        if (auth.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        }
        const res = await fetch(`${API_URL}/api/user/status`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAssessmentStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch assessment status in profile:", err);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  useEffect(() => {
    if (user) {
      console.log("Firebase Auth User PhotoURL:", user.photoURL);
      console.log("Firebase Auth User DisplayName:", user.displayName);
      console.log("Firebase Auth User Email:", user.email);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  const isGoogle = user.providerData.some((p) => p.providerId === "google.com");

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "PT";

  return (
    <div className="mx-auto max-w-xl px-6 py-10 lg:py-14">
      {/* Header section with back button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">User Profile</h1>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs border-border hover:bg-accent/40"
        >
          <Link to="/dashboard">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Main Single Centered Card */}
      <Card className="border-border/80 bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          <Avatar className="h-20 w-20 border border-border/80 shadow-sm">
            <AvatarImage
              src={
                user.providerData.find((p) => p.providerId === "google.com")?.photoURL ||
                user.photoURL ||
                undefined
              }
              alt={user.displayName || "Patient"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Details */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5 text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-teal/80" /> Name
              </span>
              <span className="font-semibold text-foreground">{user.displayName || "Patient"}</span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2.5 text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal/80" /> Email
              </span>
              <span
                className="font-semibold text-foreground truncate max-w-[220px]"
                title={user.email || ""}
              >
                {user.email}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2.5 text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal/80" /> Account Type
              </span>
              <Badge
                variant="secondary"
                className="bg-teal/5 text-teal border border-teal/15 font-medium text-xs px-2 py-0.5"
              >
                {isGoogle ? "Google Account" : "Email Account"}
              </Badge>
            </div>
          </div>

          {/* Health Profile Status (Reassessment Panel) */}
          <div className="w-full space-y-2.5 pt-2 text-left border-t border-border/40">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-teal/80">
              Health Profile Onboarding
            </h3>
            <Card className="border border-border bg-surface-muted/20 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-teal" /> Onboarding Status
                  </span>
                  {loadingStatus ? (
                    <Loader2 className="h-3 w-3 animate-spin text-teal" />
                  ) : (
                    <Badge className="bg-teal/15 text-teal hover:bg-teal/15 border-teal/10 font-bold rounded-full text-[10px] uppercase">
                      {assessmentStatus?.hasCompletedAssessment ? "Completed" : "Pending"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0 pb-3 text-xs text-muted-foreground leading-normal">
                <p>
                  Your assessment is used to calculate risk scores and personalize your action plan.
                </p>
                {assessmentStatus?.lastAssessmentUpdate && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                    Last Updated: {formatDate(assessmentStatus.lastAssessmentUpdate)}
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => navigate({ to: "/assessment" })}
                  className="w-full bg-teal text-white hover:bg-teal/95 font-bold text-xs h-9 cursor-pointer"
                >
                  {assessmentStatus?.hasCompletedAssessment ? "Reassess Health Profile" : "Start Initial Assessment"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="w-full space-y-2.5 pt-2 text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-teal/80">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="h-10 text-xs border-border hover:bg-teal/5 hover:border-teal/30 hover:text-teal font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <Link to="/report">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>View Report</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 text-xs border-border hover:bg-teal/5 hover:border-teal/30 hover:text-teal font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <Link to="/dashboard">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Risk Dashboard</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full pt-2">
            <Button
              onClick={logout}
              variant="destructive"
              className="w-full h-10 gap-2 font-semibold text-sm transition-all duration-200"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

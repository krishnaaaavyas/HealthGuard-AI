import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLanguage, tr } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, syncing, logout, hasCompletedAssessment } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentLang = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      if (pathname && pathname !== "/") {
        navigate({ to: "/login", search: { redirect: pathname } });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [user, loading, navigate, pathname]);

  useEffect(() => {
    if (!loading && user && hasCompletedAssessment !== null) {
      if (!hasCompletedAssessment && pathname !== "/assessment") {
        navigate({ to: "/assessment" });
      }
    }
  }, [user, loading, hasCompletedAssessment, pathname, navigate]);

  if (loading || syncing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-teal" />
          <p className="text-sm font-medium text-muted-foreground">
            {syncing ? tr("syncingRecord", currentLang) : tr("verifyingCredentials", currentLang)}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "PT";

  return (
    <SidebarProvider defaultOpen>
      <Toaster richColors position="top-center" />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <div className="hidden text-sm font-medium text-muted-foreground sm:block">
              {tr("clinicalPlatform", currentLang)}
            </div>

            <div className="ml-auto flex items-center gap-4">
              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer focus:outline-none select-none">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage
                        src={
                          user.providerData.find((p) => p.providerId === "google.com")?.photoURL ||
                          user.photoURL ||
                          undefined
                        }
                        alt={user.displayName || tr("patient", currentLang)}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-semibold text-foreground md:inline-block">
                      {user.displayName || tr("patient", currentLang)}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border bg-surface">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {user.displayName || tr("patient", currentLang)}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-border" />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard">{tr("riskDashboard", currentLang)}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile">{tr("myProfile", currentLang)}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-500 hover:bg-red-500/10 cursor-pointer font-medium"
                  >
                    {tr("logOut", currentLang)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

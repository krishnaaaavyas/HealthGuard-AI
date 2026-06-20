import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Heart,
  Users,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Activity,
  BookOpen,
} from "lucide-react";
import { useLanguage, tr } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const currentLang = useLanguage();

  useEffect(() => {
    document.title = `${tr("about", currentLang)} HealthGuard — Educational Assessment Portal`;
  }, [currentLang]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* Hero Section */}
        <section className="border-b border-border bg-surface-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-35 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent" />
          <div className="mx-auto max-w-7xl px-6 py-24 relative text-center">
            <Badge
              variant="secondary"
              className="rounded-full bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20"
            >
              {tr("aboutPlatform", currentLang)}
            </Badge>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
              HealthGuard
            </h1>
            <p className="mt-6 mx-auto max-w-3xl text-lg sm:text-xl leading-relaxed text-muted-foreground">
              {tr("aboutSub", currentLang)}
            </p>
          </div>
        </section>

        {/* Developers Section */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <Card className="border-border/80 bg-surface shadow-card-soft overflow-hidden hover:border-teal/30 hover:shadow-md transition-all duration-300">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-teal font-mono">
                  {tr("builtBy", currentLang)}
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Krish Savaliya & Krishna Vyas
                </h2>
                <p className="text-sm text-muted-foreground">{tr("aboutDevsSub", currentLang)}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Focus Areas Section */}
        <section className="border-t border-b border-border bg-surface-muted/10 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge
                variant="secondary"
                className="rounded-full bg-teal/10 text-teal border border-teal/20"
              >
                {tr("coreDomains", currentLang)}
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
                {tr("focusAreas", currentLang)}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr("coreDomainsSub", currentLang)}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: tr("diabetesRisk", currentLang),
                  desc: tr("diabetesRiskDesc", currentLang),
                },
                {
                  icon: Activity,
                  title: tr("hypertensionRisk", currentLang),
                  desc: tr("hypertensionRiskDesc", currentLang),
                },
                {
                  icon: Heart,
                  title: tr("heartDiseaseRisk", currentLang),
                  desc: tr("heartDiseaseRiskDesc", currentLang),
                },
              ].map((f, idx) => (
                <Card
                  key={idx}
                  className="border-border/80 bg-surface shadow-card-soft hover:shadow-md hover:border-teal/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                      <f.icon className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Educational Project Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge
              variant="secondary"
              className="rounded-full bg-teal/10 text-teal border border-teal/20"
            >
              {tr("frameworkEthics", currentLang)}
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
              {tr("eduProjectLinks", currentLang)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr("frameworkEthicsSub", currentLang)}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Privacy Card */}
            <Link to="/privacy" className="group block">
              <Card className="border-border bg-surface shadow-card-soft group-hover:border-teal/50 group-hover:shadow-md transition-all duration-300 h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-teal transition-colors flex items-center gap-1.5">
                      {tr("privacyPolicy", currentLang)}{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {tr("privacyPolicyDesc", currentLang)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Clinical Sources Card */}
            <Link to="/clinical-sources" className="group block">
              <Card className="border-border bg-surface shadow-card-soft group-hover:border-teal/50 group-hover:shadow-md transition-all duration-300 h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-teal transition-colors flex items-center gap-1.5">
                      {tr("clinicalSources", currentLang)}{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {tr("clinicalSourcesDesc", currentLang)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <Card className="border border-danger/30 bg-danger/5 text-danger-foreground rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {tr("medicalDisclaimer", currentLang)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tr("medicalDisclaimerDesc", currentLang)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

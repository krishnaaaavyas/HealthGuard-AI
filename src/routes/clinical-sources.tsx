import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, Activity, Brain, BookOpen } from "lucide-react";
import { useLanguage, tr } from "@/lib/i18n";

export const Route = createFileRoute("/clinical-sources")({
  component: ClinicalSourcesPage,
});

function ClinicalSourcesPage() {
  const currentLang = useLanguage();

  useEffect(() => {
    document.title = `${tr("clinicalSources", currentLang)} — HealthGuard`;
  }, [currentLang]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* Hero Section */}
        <section className="border-b border-border bg-surface-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 py-20 relative">
            <Badge
              variant="secondary"
              className="rounded-full bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20"
            >
              {tr("evidenceBasedMedicine", currentLang)}
            </Badge>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-foreground">
              {tr("clinicalGuidelinesTitle", currentLang)}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {tr("clinicalGuidelinesDesc", currentLang)}
            </p>
          </div>
        </section>

        {/* Sources Detail */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Source 1: Diabetes */}
            <Card className="border-border bg-surface shadow-card-soft hover:shadow-md hover:border-teal/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {tr("diabetesRisk", currentLang)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tr("diabetesScreening", currentLang)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal font-mono">
                    {tr("primarySource", currentLang)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {tr("adaSourceTitle", currentLang)}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tr("adaSourceDesc", currentLang)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Source 2: Hypertension */}
            <Card className="border-border bg-surface shadow-card-soft hover:shadow-md hover:border-teal/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {tr("hypertensionRisk", currentLang)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tr("bpClassification", currentLang)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal font-mono">
                    {tr("primarySource", currentLang)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {tr("accAhaSourceTitle", currentLang)}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tr("accAhaSourceDesc", currentLang)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Source 3: Heart Disease */}
            <Card className="border-border bg-surface shadow-card-soft hover:shadow-md hover:border-teal/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {tr("heartDiseaseRisk", currentLang)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tr("cvRiskEstimation", currentLang)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal font-mono">
                    {tr("primarySource", currentLang)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {tr("ahaAccSourceTitle", currentLang)}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tr("cvSourceDesc", currentLang)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Disclaimer section */}
        <section className="border-t border-border bg-surface-muted/20 py-16">
          <div className="mx-auto max-w-4xl px-6 flex flex-col items-center gap-4">
            <BookOpen className="h-8 w-8 text-teal" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {tr("projectStatementTitle", currentLang)}
            </h2>
            <p className="text-center text-sm leading-relaxed text-muted-foreground max-w-2xl">
              {tr("projectStatementDesc", currentLang)}
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, EyeOff, Lock, Database, Trash2, Key } from "lucide-react";
import { useLanguage, tr } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const currentLang = useLanguage();

  useEffect(() => {
    document.title = `${tr("privacyTitle", currentLang)} — HealthGuard`;
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
              {tr("dataPrivacySecurity", currentLang)}
            </Badge>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-foreground">
              {tr("yourHealthDataBelongsToYou", currentLang)}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {tr("privacyHeroDesc", currentLang)}
            </p>
          </div>
        </section>

        {/* Core Principles */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: tr("p1Title", currentLang),
                desc: tr("p1Desc", currentLang),
              },
              {
                icon: EyeOff,
                title: tr("p2Title", currentLang),
                desc: tr("p2Desc", currentLang),
              },
              {
                icon: Lock,
                title: tr("p3Title", currentLang),
                desc: tr("p3Desc", currentLang),
              },
              {
                icon: Database,
                title: tr("p4Title", currentLang),
                desc: tr("p4Desc", currentLang),
              },
              {
                icon: Trash2,
                title: tr("p5Title", currentLang),
                desc: tr("p5Desc", currentLang),
              },
              {
                icon: Key,
                title: tr("p6Title", currentLang),
                desc: tr("p6Desc", currentLang),
              },
            ].map((p, idx) => (
              <Card
                key={idx}
                className="border-border bg-surface shadow-card-soft hover:shadow-md hover:border-teal/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Transparency Banner */}
        <section className="border-t border-border bg-surface-muted/20 py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {tr("eduTransparencyTitle", currentLang)}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {tr("eduTransparencyDesc", currentLang)}
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

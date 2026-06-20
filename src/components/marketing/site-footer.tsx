import { HeartPulse } from "lucide-react";
import { useLanguage, tr } from "@/lib/i18n";

export function SiteFooter() {
  const currentLang = useLanguage();

  return (
    <footer className="border-t border-border bg-surface-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Project Overview */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal">
                <HeartPulse className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div className="font-display text-base font-bold tracking-tight text-foreground">
                HealthGuard
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {tr("footerDesc", currentLang)}
            </p>
          </div>

          {/* Focus Areas */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              {tr("focusAreas", currentLang)}
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{tr("diabetes", currentLang)}</li>
              <li>{tr("hypertension", currentLang)}</li>
              <li>{tr("heartDisease", currentLang)}</li>
            </ul>
          </div>

          {/* Developers */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              {tr("developers", currentLang)}
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Krish Savaliya</li>
              <li>Krishna Vyas</li>
            </ul>
          </div>
        </div>

        {/* Separator & Disclaimer */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tr("footerDisclaimer", currentLang)}
          </p>
          <div className="text-xs text-muted-foreground/80">
            {tr("fit_report_copyright", currentLang).replace(
              "{year}",
              new Date().getFullYear().toString(),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

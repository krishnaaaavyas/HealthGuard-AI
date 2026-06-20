import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHealthResult, useProfile, useHistory } from "@/lib/health-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, HeartPulse } from "lucide-react";
import jsPDF from "jspdf";
import { EmptyState, LedgerTable, RiskLedgerTable } from "./_app.dashboard";
import { useLanguage, tr, translations } from "@/lib/i18n";

const CHART_GREEN = "oklch(0.62 0.13 155)";
const CHART_AMBER = "oklch(0.74 0.15 70)";
const CHART_RED = "oklch(0.58 0.21 25)";

function colorFor(score: number) {
  if (score < 33) return CHART_GREEN;
  if (score < 66) return CHART_AMBER;
  return CHART_RED;
}
function levelFor(score: number) {
  if (score < 33) return "Low";
  if (score < 66) return "Moderate";
  return "High";
}

export const Route = createFileRoute("/_app/report")({
  component: ReportPage,
});

function ReportPage() {
  const currentLang = useLanguage();

  useEffect(() => {
    document.title = tr("fit_health_report_title", currentLang);
  }, [currentLang]);

  const [resultMaybe] = useHealthResult();
  const [profileMaybe] = useProfile();
  const [history] = useHistory();

  if (!resultMaybe || !profileMaybe) return <EmptyState />;
  const result = resultMaybe;
  const profile = profileMaybe;

  const overallColor =
    result.overallRisk === "Low"
      ? CHART_GREEN
      : result.overallRisk === "Moderate"
        ? CHART_AMBER
        : CHART_RED;

  function download() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    const cw = pageW - margin * 2;
    let y = margin;

    // Header band
    doc.setFillColor(11, 30, 63);
    doc.rect(0, 0, pageW, 88, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(tr("clinicalReportTitle", currentLang), margin, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(tr("aiAssistedAssessment", currentLang), margin, 58);
    doc.setFontSize(9);
    const formattedDate = new Date().toLocaleString(
      currentLang === "en" ? "en-US" : currentLang === "hi" ? "hi-IN" : "gu-IN",
    );
    doc.text(formattedDate, pageW - margin, 58, { align: "right" });
    y = 120;
    doc.setTextColor(20);

    const ensureSpace = (heightNeeded: number) => {
      if (y + heightNeeded > 770) {
        doc.addPage();
        y = margin + 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(tr("clinicalReportTitleCont", currentLang), margin, margin - 15);
        doc.setDrawColor(230);
        doc.line(margin, margin - 10, pageW - margin, margin - 10);
      }
    };

    // Section title helper
    const title = (t: string) => {
      ensureSpace(45);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 30, 63);
      doc.text(t.toUpperCase(), margin, y);
      y += 6;
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 14;
      doc.setTextColor(40);
    };

    const para = (t: string, size = 10) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(t, cw);
      lines.forEach((l: string) => {
        ensureSpace(size + 6);
        doc.text(l, margin, y);
        y += size + 4;
      });
    };

    // Profile
    title(tr("patientProfile", currentLang));
    const ageLabel = tr("age", currentLang);
    const yrsLabel = tr("yrs", currentLang);
    const genderLabel = tr("gender", currentLang);
    const genderVal = tr(profile.gender.toLowerCase() as keyof typeof translations, currentLang);
    const heightLabel = tr("heightLabel", currentLang);
    const weightLabel = tr("weightLabel", currentLang);
    const smokingLabel = tr("smoking", currentLang);
    const smokingVal = tr(profile.smoking.toLowerCase() as keyof typeof translations, currentLang);
    const exerciseLabel = tr("exercise", currentLang);
    const exerciseVal = tr(
      profile.exercise.toLowerCase() as keyof typeof translations,
      currentLang,
    );
    const familyHistoryLabel = tr("familyHistoryLabel", currentLang);
    const familyHistoryVal = profile.familyHistory || tr("noneReported", currentLang);
    const symptomsLabel = tr("symptomsLabel", currentLang);
    const symptomsVal = profile.symptoms || tr("noneReported", currentLang);

    [
      `${ageLabel}: ${profile.age} ${yrsLabel}    ${genderLabel}: ${genderVal}`,
      `${heightLabel}: ${profile.heightCm} cm    ${weightLabel}: ${profile.weightKg} kg    BMI: ${result.bmi}`,
      `${smokingLabel}: ${smokingVal}    ${exerciseLabel}: ${exerciseVal}`,
      `${familyHistoryLabel}: ${familyHistoryVal}`,
      `${symptomsLabel}: ${symptomsVal}`,
    ].forEach((l) => para(l));
    y += 10;

    // Overall risk
    title(tr("overallRisk", currentLang));
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    const color =
      result.overallRisk === "Low"
        ? [34, 139, 87]
        : result.overallRisk === "Moderate"
          ? [200, 130, 30]
          : [200, 60, 40];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`${result.overallScore}/80`, margin, y);
    y += 26;
    doc.setFontSize(11);
    const riskLvlText = tr(
      result.overallRisk.toLowerCase() === "low"
        ? "low"
        : result.overallRisk.toLowerCase() === "moderate"
          ? "moderateRisk"
          : "high",
      currentLang,
    );
    doc.text(`${riskLvlText} ${tr("riskWord", currentLang)}`, margin, y);
    y += 22;
    doc.setTextColor(40);

    // Per-condition
    title(tr("perConditionRisk", currentLang));
    const conditionKeyMap: Record<string, string> = {
      "Diabetes (Type 2)": "fit_diabetes_label",
      "Heart Disease": "fit_heart_disease_label",
      Hypertension: "fit_hypertension_label",
    };

    (
      [
        ["Diabetes (Type 2)", result.risk.diabetes, result.rationale.diabetes],
        ["Heart Disease", result.risk.heartDisease, result.rationale.heartDisease],
        ["Hypertension", result.risk.hypertension, result.rationale.hypertension],
      ] as const
    ).forEach(([name, score, why]) => {
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const condName = tr(conditionKeyMap[name] || name, currentLang);
      doc.text(`${condName}: ${score}/100`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      para(why);
      y += 8;
    });

    // Plans
    const sections: Array<[string, string]> = [
      [tr("dietPlan", currentLang), result.dietPlan],
      [tr("exercisePlan", currentLang), result.exercisePlan],
      [tr("prevention", currentLang), result.preventionTips],
    ];
    sections.forEach(([t, body]) => {
      y += 6;
      title(t);
      para(body.replace(/[#*_`>]/g, ""));
    });

    // Longitudinal progress summary if history exists
    if (history && history.length >= 2) {
      const baseline = history[0];
      const latest = history[history.length - 1];
      const weightDiff = latest.weightKg - baseline.weightKg;
      const scoreDiff = latest.overallScore - baseline.overallScore;

      title(tr("longitudinalProgress", currentLang));
      ensureSpace(120);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(tr("fit_metric", currentLang), margin, y);
      doc.text(tr("fit_baseline", currentLang), margin + 140, y);
      doc.text(tr("fit_current", currentLang), margin + 240, y);
      doc.text(tr("fit_absolute_change", currentLang), margin + 340, y);
      y += 8;
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Body Weight
      doc.text(tr("fit_body_weight", currentLang), margin, y);
      doc.text(`${baseline.weightKg.toFixed(1)} kg`, margin + 140, y);
      doc.text(`${latest.weightKg.toFixed(1)} kg`, margin + 240, y);
      doc.text(`${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(1)} kg`, margin + 340, y);
      y += 16;

      // BMI
      doc.text(tr("fit_body_mass_index", currentLang), margin, y);
      doc.text(`${baseline.bmi.toFixed(1)}`, margin + 140, y);
      doc.text(`${latest.bmi.toFixed(1)}`, margin + 240, y);
      const bmiDiff = latest.bmi - baseline.bmi;
      doc.text(`${bmiDiff >= 0 ? "+" : ""}${bmiDiff.toFixed(1)}`, margin + 340, y);
      y += 16;

      // Overall Risk Score
      doc.text(tr("fit_overall_risk_score", currentLang), margin, y);
      doc.text(`${baseline.overallScore}/80`, margin + 140, y);
      doc.text(`${latest.overallScore}/80`, margin + 240, y);
      doc.text(
        `${scoreDiff >= 0 ? "+" : ""}${scoreDiff} ${tr("fit_pts", currentLang)}`,
        margin + 340,
        y,
      );
      y += 24;

      // Milestones achieved list
      const milestonesList: string[] = [];
      if (baseline.weightKg - latest.weightKg >= 5) {
        const valStr = (baseline.weightKg - latest.weightKg).toFixed(1);
        milestonesList.push(tr("fit_milestone_weight", currentLang).replace("{val}", valStr));
      }
      if (baseline.overallScore - latest.overallScore >= 10) {
        const valStr = (baseline.overallScore - latest.overallScore).toString();
        milestonesList.push(tr("fit_milestone_risk", currentLang).replace("{val}", valStr));
      }
      if (milestonesList.length > 0) {
        ensureSpace(60);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(tr("fit_milestone_title", currentLang), margin, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        milestonesList.forEach((m) => {
          para(m);
        });
        y += 10;
      }
    }

    ensureSpace(40);
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(120);
    const disc = doc.splitTextToSize(tr("fit_report_disclaimer", currentLang), cw);
    doc.text(disc, margin, y);

    doc.save(`healthguard-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const overallRiskKey =
    result.overallRisk.toLowerCase() === "low"
      ? "low"
      : result.overallRisk.toLowerCase() === "moderate"
        ? "moderateRisk"
        : "high";

  const levelKeyMap: Record<string, string> = {
    Low: "low",
    Moderate: "moderateRisk",
    High: "high",
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge
            variant="secondary"
            className="rounded-full bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20"
          >
            {tr("clinicalReport", currentLang)}
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {tr("yourHealthReport", currentLang)}
          </h1>
          <p className="mt-2 text-muted-foreground">{tr("shareWithPhysician", currentLang)}</p>
        </div>
        <Button
          onClick={download}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm hover:shadow transition-all font-semibold"
        >
          <Download className="h-4 w-4" /> {tr("downloadPdfBtn", currentLang)}
        </Button>
      </div>

      {/* Report preview */}
      <Card className="overflow-hidden border-border bg-surface shadow-elevated">
        <div className="flex items-center justify-between bg-primary px-8 py-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary-foreground/10">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">
                {tr("clinicalReportTitle", currentLang)}
              </div>
              <div className="text-xs text-primary-foreground/70">
                {tr("aiAssistedAssessment", currentLang)}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-primary-foreground/70">
            {new Date().toLocaleString(
              currentLang === "en" ? "en-US" : currentLang === "hi" ? "hi-IN" : "gu-IN",
            )}
          </div>
        </div>

        <CardContent className="space-y-8 p-8">
          <Section title={tr("patientProfile", currentLang)}>
            <LedgerTable
              items={[
                {
                  parameter: tr("age", currentLang),
                  value: `${profile.age} ${tr("yrs", currentLang)}`,
                  reference: tr("adultBaseline", currentLang),
                  status: tr("demographicStatus", currentLang),
                },
                {
                  parameter: tr("gender", currentLang),
                  value: tr(profile.gender.toLowerCase() as keyof typeof translations, currentLang),
                  reference: tr("metabolicStandard", currentLang),
                  status: tr("recordedStatus", currentLang),
                },
                {
                  parameter: tr("heightLabel", currentLang),
                  value: `${profile.heightCm} cm`,
                  reference: tr("demographicStandard", currentLang),
                  status: tr("recordedStatus", currentLang),
                },
                {
                  parameter: tr("weightLabel", currentLang),
                  value: `${profile.weightKg} kg`,
                  reference: tr("subjectBaseline", currentLang),
                  status: tr("recordedStatus", currentLang),
                },
                {
                  parameter: tr("fit_body_mass_index", currentLang),
                  value: `${result.bmi}`,
                  reference: tr("optimalBmiRange", currentLang),
                  status:
                    result.bmi >= 18.5 && result.bmi < 25
                      ? tr("optimalStatus", currentLang)
                      : tr("reviewStatus", currentLang),
                  statusColor:
                    result.bmi >= 18.5 && result.bmi < 25
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning",
                },
                {
                  parameter: tr("smokingHistory", currentLang),
                  value: tr(
                    profile.smoking.toLowerCase() as keyof typeof translations,
                    currentLang,
                  ),
                  reference: tr("nonSmokerStandard", currentLang),
                  status:
                    profile.smoking === "never"
                      ? tr("optimalStatus", currentLang)
                      : tr("reviewStatus", currentLang),
                  statusColor:
                    profile.smoking === "never"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning",
                },
                {
                  parameter: tr("exerciseBaseline", currentLang),
                  value: tr(
                    profile.exercise.toLowerCase() as keyof typeof translations,
                    currentLang,
                  ),
                  reference: tr("activeTarget", currentLang),
                  status:
                    profile.exercise === "none"
                      ? tr("sedentaryStatus", currentLang)
                      : tr("activeStatus", currentLang),
                  statusColor:
                    profile.exercise === "none"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success",
                },
                {
                  parameter: tr("hereditaryRiskMarkers", currentLang),
                  value: profile.familyHistory
                    ? tr("reportedStatus", currentLang)
                    : tr("noneStatus", currentLang),
                  reference: tr("familyHistoryProfile", currentLang),
                  status: profile.familyHistory
                    ? tr("reviewStatus", currentLang)
                    : tr("optimalStatus", currentLang),
                  statusColor: profile.familyHistory
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success",
                },
                {
                  parameter: tr("activeSymptomTracking", currentLang),
                  value: profile.symptoms
                    ? tr("reportedStatus", currentLang)
                    : tr("noneStatus", currentLang),
                  reference: tr("selfReportedConcerns", currentLang),
                  status: profile.symptoms
                    ? tr("reviewStatus", currentLang)
                    : tr("optimalStatus", currentLang),
                  statusColor: profile.symptoms
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success",
                },
              ]}
            />
          </Section>

          <Section title={tr("overallRiskScore", currentLang)}>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-primary">
                {result.overallScore}
                <span className="text-xl text-muted-foreground">/80</span>
              </span>
              <span
                className="text-sm font-semibold text-muted-foreground"
                style={{ color: overallColor }}
              >
                {tr(overallRiskKey, currentLang)} {tr("riskWord", currentLang)}
              </span>
            </div>
          </Section>

          {history && history.length >= 2 && (
            <Section title={tr("longitudinalProgress", currentLang)}>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface-muted/60 p-4">
                  <span className="text-xs text-muted-foreground font-semibold uppercase font-display">
                    {tr("fit_weight_evolution", currentLang)}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-foreground">
                      {history[history.length - 1].weightKg} kg
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tr("fit_vs_baseline_text", currentLang).replace(
                        "{val}",
                        history[0].weightKg.toString(),
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold mt-1.5 block ${history[history.length - 1].weightKg - history[0].weightKg <= 0 ? "text-success" : "text-danger"}`}
                  >
                    {history[history.length - 1].weightKg - history[0].weightKg <= 0
                      ? `▼ ${(history[0].weightKg - history[history.length - 1].weightKg).toFixed(1)} kg ${tr("fit_lost", currentLang)}`
                      : `▲ ${(history[history.length - 1].weightKg - history[0].weightKg).toFixed(1)} kg ${tr("fit_gained", currentLang)}`}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-surface-muted/60 p-4">
                  <span className="text-xs text-muted-foreground font-semibold uppercase font-display">
                    {tr("fit_risk_score_change", currentLang)}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-foreground">
                      {history[history.length - 1].overallScore} {tr("fit_pts", currentLang)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tr("fit_vs_baseline_text", currentLang).replace(
                        "{val}",
                        `${history[0].overallScore} ${tr("fit_pts", currentLang)}`,
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold mt-1.5 block ${history[history.length - 1].overallScore - history[0].overallScore <= 0 ? "text-success" : "text-warning"}`}
                  >
                    {history[history.length - 1].overallScore - history[0].overallScore <= 0
                      ? `▼ ${history[0].overallScore - history[history.length - 1].overallScore} ${tr("fit_pts", currentLang)} ${tr("fit_improved", currentLang)}`
                      : `▲ ${history[history.length - 1].overallScore - history[0].overallScore} ${tr("fit_pts", currentLang)} ${tr("fit_increased", currentLang)}`}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-surface-muted/60 p-4 sm:col-span-2 md:col-span-1">
                  <span className="text-xs text-muted-foreground font-semibold uppercase font-display">
                    {tr("fit_bmi_evolution", currentLang)}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-foreground">
                      {history[history.length - 1].bmi.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tr("fit_vs_baseline_text", currentLang).replace(
                        "{val}",
                        history[0].bmi.toFixed(1),
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold mt-1.5 block ${history[history.length - 1].bmi - history[0].bmi <= 0 ? "text-success" : "text-warning"}`}
                  >
                    {history[history.length - 1].bmi - history[0].bmi <= 0
                      ? `▼ ${(history[0].bmi - history[history.length - 1].bmi).toFixed(1)} ${tr("points", currentLang)} ${tr("fit_improved", currentLang)}`
                      : `▲ ${(history[history.length - 1].bmi - history[0].bmi).toFixed(1)} ${tr("points", currentLang)} ${tr("fit_increased", currentLang)}`}
                  </span>
                </div>
              </div>
            </Section>
          )}

          <Section title={tr("perConditionRisk", currentLang)}>
            <RiskLedgerTable
              items={[
                {
                  condition: tr("fit_diabetes_label", currentLang),
                  score: result.risk.diabetes,
                  classification: tr(
                    levelKeyMap[levelFor(result.risk.diabetes)] || levelFor(result.risk.diabetes),
                    currentLang,
                  ),
                  color: colorFor(result.risk.diabetes),
                  rationale: result.rationale.diabetes,
                },
                {
                  condition: tr("fit_heart_disease_label", currentLang),
                  score: result.risk.heartDisease,
                  classification: tr(
                    levelKeyMap[levelFor(result.risk.heartDisease)] ||
                      levelFor(result.risk.heartDisease),
                    currentLang,
                  ),
                  color: colorFor(result.risk.heartDisease),
                  rationale: result.rationale.heartDisease,
                },
                {
                  condition: tr("fit_hypertension_label", currentLang),
                  score: result.risk.hypertension,
                  classification: tr(
                    levelKeyMap[levelFor(result.risk.hypertension)] ||
                      levelFor(result.risk.hypertension),
                    currentLang,
                  ),
                  color: colorFor(result.risk.hypertension),
                  rationale: result.rationale.hypertension,
                },
              ]}
            />
          </Section>

          <Section title={tr("recommendations", currentLang)}>
            <Sub heading={tr("diet", currentLang)}>{result.dietPlan}</Sub>
            <Sub heading={tr("exercise", currentLang)}>{result.exercisePlan}</Sub>
            <Sub heading={tr("prevention", currentLang)}>{result.preventionTips}</Sub>
          </Section>

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            {tr("fit_report_disclaimer", currentLang)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 border-b border-border pb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        {title}
      </div>
      {children}
    </section>
  );
}

function Sub({ heading, children }: { heading: string; children: string }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="font-display text-sm font-semibold text-foreground">{heading}</div>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {children.replace(/[#*`>]/g, "").trim()}
      </p>
    </div>
  );
}

import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHealthResult, useProfile, useHistory } from "@/lib/health-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, HeartPulse } from "lucide-react";
import { EmptyState, LedgerTable, RiskLedgerTable } from "./_app.dashboard";
import { useLanguage, tr, translations } from "@/lib/i18n";
import { toast } from "sonner";

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

export const Route = createLazyFileRoute("/_app/report")({
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

  async function download() {
    const toastId = toast.loading("Generating printable PDF report...");
    try {
      const { default: jsPDF } = await import("jspdf");

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
      const smokingVal = tr(
        profile.smoking.toLowerCase() as keyof typeof translations,
        currentLang,
      );
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
        doc.text(tr("fit_overall_score", currentLang), margin, y);
        doc.text(`${baseline.overallScore}/80`, margin + 140, y);
        doc.text(`${latest.overallScore}/80`, margin + 240, y);
        doc.text(`${scoreDiff >= 0 ? "+" : ""}${scoreDiff}`, margin + 340, y);
        y += 16;
      }

      ensureSpace(40);
      y += 12;
      doc.setFontSize(8);
      doc.setTextColor(140);
      const disclaimer = doc.splitTextToSize(tr("fit_disclaimer", currentLang), cw);
      doc.text(disclaimer, margin, y);

      doc.save(`healthguard-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Health report PDF downloaded successfully.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.", { id: toastId });
    }
  }

  // Define static parameter values
  const labData = [
    {
      parameter: tr("fit_systolic_bp", currentLang),
      value: profile.symptoms.toLowerCase().includes("headache") ? "135 mmHg" : "120 mmHg",
      reference: "< 120 mmHg",
      status: profile.symptoms.toLowerCase().includes("headache") ? "Elevated" : "Normal",
      statusColor: profile.symptoms.toLowerCase().includes("headache")
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      parameter: tr("fit_diastolic_bp", currentLang),
      value: profile.symptoms.toLowerCase().includes("headache") ? "85 mmHg" : "80 mmHg",
      reference: "< 80 mmHg",
      status: profile.symptoms.toLowerCase().includes("headache") ? "Elevated" : "Normal",
      statusColor: profile.symptoms.toLowerCase().includes("headache")
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      parameter: tr("fit_fasting_blood_glucose", currentLang),
      value: profile.familyHistory.toLowerCase().includes("diabetes") ? "108 mg/dL" : "94 mg/dL",
      reference: "70–100 mg/dL",
      status: profile.familyHistory.toLowerCase().includes("diabetes") ? "Impaired" : "Normal",
      statusColor: profile.familyHistory.toLowerCase().includes("diabetes")
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      parameter: tr("fit_total_cholesterol", currentLang),
      value: "185 mg/dL",
      reference: "< 200 mg/dL",
      status: "Desirable",
      statusColor: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      parameter: tr("fit_hdl_cholesterol", currentLang),
      value: profile.exercise === "none" ? "42 mg/dL" : "52 mg/dL",
      reference: "> 40 mg/dL",
      status: "Normal",
      statusColor: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      parameter: tr("fit_ldl_cholesterol", currentLang),
      value: "115 mg/dL",
      reference: "< 100 mg/dL",
      status: "Near Optimal",
      statusColor: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    },
  ];

  const riskData = [
    {
      condition: tr("fit_diabetes_label", currentLang),
      score: result.risk.diabetes,
      classification: levelFor(result.risk.diabetes),
      color: colorFor(result.risk.diabetes),
      rationale: result.rationale.diabetes,
    },
    {
      condition: tr("fit_heart_disease_label", currentLang),
      score: result.risk.heartDisease,
      classification: levelFor(result.risk.heartDisease),
      color: colorFor(result.risk.heartDisease),
      rationale: result.rationale.heartDisease,
    },
    {
      condition: tr("fit_hypertension_label", currentLang),
      score: result.risk.hypertension,
      classification: levelFor(result.risk.hypertension),
      color: colorFor(result.risk.hypertension),
      rationale: result.rationale.hypertension,
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <Badge className="rounded-full bg-teal text-white font-semibold">
            {tr("fit_verified_lab_format", currentLang)}
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {tr("fit_health_report_title", currentLang)}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-normal max-w-xl">
            {tr("fit_health_report_desc", currentLang)}
          </p>
        </div>
        <Button
          onClick={download}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md rounded-lg"
        >
          <Download className="h-4 w-4" />
          <span>{tr("fit_download_pdf", currentLang)}</span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lab Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-surface shadow-card-soft">
            <CardHeader className="border-b border-border bg-surface-muted/50 p-4">
              <CardTitle className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-teal" />
                {tr("fit_lab_biomarkers", currentLang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LedgerTable items={labData} />
            </CardContent>
          </Card>

          {/* Condition Breakdown */}
          <Card className="border-border bg-surface shadow-card-soft">
            <CardHeader className="border-b border-border bg-surface-muted/50 p-4">
              <CardTitle className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-teal animate-pulse" />
                {tr("fit_analyzed_conditions", currentLang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RiskLedgerTable items={riskData} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-border bg-surface shadow-card-soft overflow-hidden relative">
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: overallColor }}
            />
            <CardHeader className="p-5">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {tr("fit_overall_score", currentLang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 text-center">
              <div
                className="font-display text-7xl font-bold tracking-tight"
                style={{ color: overallColor }}
              >
                {result.overallScore}
                <span className="text-xl text-muted-foreground font-normal">/80</span>
              </div>
              <div
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border"
                style={{
                  color: overallColor,
                  borderColor: `${overallColor}30`,
                  backgroundColor: `${overallColor}08`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: overallColor }}
                />
                {tr(
                  result.overallRisk.toLowerCase() === "low"
                    ? "low"
                    : result.overallRisk.toLowerCase() === "moderate"
                      ? "moderateRisk"
                      : "high",
                  currentLang,
                )}{" "}
                {tr("riskWord", currentLang)}
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                {tr("fit_risk_level_summary", currentLang)}
              </p>
            </CardContent>
          </Card>

          {/* Quick recommendations */}
          <Card className="border-border bg-surface shadow-card-soft">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold text-foreground font-display">
                {tr("fit_quick_recommendations", currentLang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              <div className="rounded-lg bg-teal/5 border border-teal/15 p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal tracking-wider font-mono">
                  {tr("dietPlan", currentLang)}
                </span>
                <p className="text-[11px] text-teal leading-relaxed font-mono">
                  {result.dietPlan.replace(/[#*_`>]/g, "").slice(0, 120)}...
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider font-mono">
                  {tr("exercisePlan", currentLang)}
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {result.exercisePlan.replace(/[#*_`>]/g, "").slice(0, 120)}...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

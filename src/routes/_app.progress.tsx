import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  Weight,
  Target,
  TrendingDown,
  Activity,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile, useHealthResult, useHistory } from "@/lib/health-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/_app/progress")({
  component: ProgressPage,
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CHART_NAVY = "oklch(0.27 0.07 258)";
const CHART_TEAL = "oklch(0.55 0.09 200)";

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  hintColor = "text-muted-foreground",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  hintColor?: string;
}) {
  return (
    <Card className="border-border bg-surface shadow-card-soft">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-teal">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="font-display text-lg font-bold text-foreground">{value}</div>
          {hint && <div className={`text-[11px] font-medium ${hintColor}`}>{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useProfile();
  const [result, setResult] = useHealthResult();
  const [history, setHistory] = useHistory();

  const [logWeightVal, setLogWeightVal] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    document.title = "Progress Tracking — HealthGuard";
  }, []);

  if (!profile || !result) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center flex flex-col items-center justify-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-teal shadow-card-soft">
          <Activity className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">
          Assessment Required
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
          Please complete your initial health assessment before opening the Progress Tracker.
        </p>
        <Button
          onClick={() => navigate({ to: "/assessment" })}
          className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold px-6 py-2 h-11"
        >
          <span>Start Assessment</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const goalWeight = Math.round(22 * Math.pow(profile.heightCm / 100, 2));
  const startWeight = history[0]?.weightKg ?? profile.weightKg;
  const currWeight = history[history.length - 1]?.weightKg ?? profile.weightKg;
  const weightLost = startWeight - currWeight;
  const toGoalWeight = currWeight - goalWeight;

  const progressChartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: h.overallScore,
    weight: h.weightKg,
  }));

  async function handleLogWeight() {
    const w = parseFloat(logWeightVal);
    if (!w || isNaN(w)) {
      toast.error("Please enter a valid weight");
      return;
    }
    setLogging(true);

    try {
      let idToken = "mock-uid-guest";
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }

      const response = await fetch(`${API_URL}/api/progress/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ weightKg: w })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setResult(data.result);
          setHistory(data.history);
          setLogWeightVal("");
          toast.success(`Logged weight: ${w} kg`);
        }
      } else {
        toast.error("Failed to log weight");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection failed");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14 space-y-8">
      {/* Header */}
      <div>
        <Badge
          variant="secondary"
          className="rounded-full bg-teal/10 text-teal border border-teal/20"
        >
          Track Vitals
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Progress Tracker
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          Log weight and track clinical risk improvements over time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Assessments completed" value={`${history.length}`} icon={Calendar} />
        <KpiCard
          label="Current weight"
          value={`${currWeight} kg`}
          icon={Weight}
          hint={
            weightLost > 0
              ? `▼ ${weightLost.toFixed(1)} kg lost`
              : weightLost < 0
                ? `▲ ${Math.abs(weightLost).toFixed(1)} kg gained`
                : "no change"
          }
          hintColor={
            weightLost > 0
              ? "text-green-500"
              : weightLost < 0
                ? "text-red-500"
                : "text-muted-foreground"
          }
        />
        <KpiCard
          label="Goal weight"
          value={`${goalWeight} kg`}
          icon={Target}
          hint={toGoalWeight > 0 ? `${toGoalWeight.toFixed(1)} kg to go` : "goal reached"}
          hintColor={toGoalWeight > 0 ? "text-amber-500" : "text-green-500"}
        />
        <KpiCard
          label="Current overall score"
          value={`${result.overallScore}`}
          icon={TrendingDown}
          hint={`${result.overallRisk} risk`}
        />
      </div>

      {/* Weight Logger Form */}
      <Card className="border-border bg-surface shadow-card-soft">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal" /> Record Current Weight
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="weight-input" className="text-xs font-semibold">
                Weight (kg)
              </Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                placeholder="e.g. 74.5"
                value={logWeightVal}
                onChange={(e) => setLogWeightVal(e.target.value)}
                disabled={logging}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleLogWeight}
              disabled={logging || !logWeightVal}
              className="bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm font-semibold text-xs h-10 px-5 rounded-lg cursor-pointer"
            >
              {logging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                </>
              ) : (
                "Record Weight"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Rendering of Trends */}
      {history.length < 3 ? (
        <Card className="border-border border-dashed bg-surface shadow-card-soft p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
          <Activity className="h-10 w-10 text-teal/40 mb-3" />
          <h3 className="font-display text-sm font-bold text-foreground">
            Progress history unavailable
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Complete additional assessments to unlock trend analysis.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weight Chart */}
            <Card className="border-border shadow-card-soft bg-surface">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="font-display text-sm font-bold text-foreground">Weight Tracking</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressChartData}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                      domain={["auto", "auto"]}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={CHART_TEAL}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Score Chart */}
            <Card className="border-border shadow-card-soft bg-surface">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="font-display text-sm font-bold text-foreground">Risk Score Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={progressChartData}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_NAVY} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={CHART_NAVY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={CHART_NAVY}
                      strokeWidth={2}
                      fill="url(#gScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

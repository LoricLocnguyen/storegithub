import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Activity, Users, Shield, Zap, AlertTriangle, CheckCircle2, BarChart3, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

interface RepoChartsProps {
  fullName: string;
}

interface InsightsData {
  languageBreakdown: { name: string; value: number }[];
  activity: { week: string; commits: number }[];
  contributorsCount: number;
  topContributors: { name: string; commits: number; avatar: string }[];
  pullRequests: number;
  stats: { stars: number; forks: number; issues: number };
  ai: any;
}

const COLORS = ["hsl(265 90% 65%)", "hsl(190 95% 60%)", "hsl(330 85% 65%)", "hsl(145 70% 55%)", "hsl(40 95% 60%)", "hsl(220 90% 65%)", "hsl(15 90% 60%)", "hsl(280 70% 70%)"];

const trendColor = (trend?: string) => {
  if (!trend) return "text-muted-foreground";
  if (trend.includes("mạnh")) return "text-green-400";
  if (trend.includes("ổn định")) return "text-cyan-400";
  if (trend.includes("chững")) return "text-yellow-400";
  return "text-red-400";
};

const ScoreRadial = ({ score, label, icon: Icon, color }: { score: number; label: string; icon: any; color: string }) => (
  <div className="relative flex flex-col items-center p-3 rounded-xl bg-muted/20 border border-border/40">
    <div className="w-24 h-24 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: score, fill: color }]} startAngle={90} endAngle={90 - (score / 100) * 360}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xl font-bold neon-text">{score}</span>
      </div>
    </div>
    <span className="text-xs text-muted-foreground mt-1">{label}</span>
  </div>
);

const RepoCharts = ({ fullName }: RepoChartsProps) => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("analyze-repo-insights", {
          body: { fullName },
        });
        if (cancelled) return;
        if (err) throw err;
        setData(res);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Lỗi tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [fullName]);

  if (loading) {
    return (
      <div className="glow-card rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
        <p className="text-sm">Đang tải biểu đồ & chỉ số AI...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glow-card rounded-xl p-6 border-destructive/40">
        <p className="text-sm text-destructive">{error || "Không có dữ liệu"}</p>
      </div>
    );
  }

  const ai = data.ai;

  return (
    <div className="space-y-6">
      {/* AI Score Radials */}
      {ai && (
        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold neon-text">Chỉ số AI đánh giá</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ScoreRadial score={ai.health?.score || 0} label={ai.health?.label || "Sức khoẻ"} icon={Shield} color={COLORS[0]} />
            <ScoreRadial score={ai.complexity?.score || 0} label={ai.complexity?.label || "Phức tạp"} icon={Zap} color={COLORS[1]} />
            <ScoreRadial score={ai.activity?.score || 0} label={ai.activity?.label || "Hoạt động"} icon={Activity} color={COLORS[2]} />
            <ScoreRadial score={ai.community?.score || 0} label={ai.community?.label || "Cộng đồng"} icon={Users} color={COLORS[3]} />
            <ScoreRadial score={ai.maintenance?.score || 0} label={ai.maintenance?.label || "Bảo trì"} icon={CheckCircle2} color={COLORS[4]} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language pie */}
        {data.languageBreakdown.length > 0 && (
          <div className="glow-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold neon-text">Phân bố ngôn ngữ</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.languageBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {data.languageBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.languageBreakdown.slice(0, 5).map((l, i) => (
                <div key={l.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{l.name}</span>
                  <span className="text-foreground font-mono">{l.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commit activity */}
        {data.activity.length > 0 && (
          <div className="glow-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold neon-text">Tần suất commit (12 tuần gần nhất)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.activity}>
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="commits" fill="url(#commitGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="commitGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[1]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Contributors + PR stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold neon-text">Top Contributors</h3>
            <span className="ml-auto text-xs text-muted-foreground">Tổng: {data.contributorsCount}+</span>
          </div>
          {data.topContributors.length > 0 ? (
            <div className="space-y-2">
              {data.topContributors.map((c, i) => {
                const max = data.topContributors[0].commits || 1;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full ring-1 ring-border" />
                    <span className="text-xs w-24 truncate">{c.name}</span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                        style={{ width: `${(c.commits / max) * 100}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }}
                      >
                        <span className="text-[10px] font-mono text-primary-foreground">{c.commits}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Không có dữ liệu</p>
          )}
        </div>

        {/* AI strengths/concerns */}
        {ai && (ai.strengths || ai.concerns) && (
          <div className="glow-card rounded-xl p-5 space-y-4">
            {ai.strengths?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-green-400">Điểm mạnh</h3>
                </div>
                <ul className="space-y-1">
                  {ai.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 pl-5 relative">
                      <span className="absolute left-0 text-green-400">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ai.concerns?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-yellow-400">Vấn đề tiềm ẩn</h3>
                </div>
                <ul className="space-y-1">
                  {ai.concerns.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 pl-5 relative">
                      <span className="absolute left-0 text-yellow-400">!</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trend prediction */}
      {ai?.future_prediction && (
        <div className="glow-card rounded-xl p-5 border-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-4 h-4 ${trendColor(ai.trend)}`} />
            <h3 className="text-sm font-semibold neon-text">Xu hướng & Dự đoán tương lai</h3>
            {ai.trend && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full bg-muted/40 ${trendColor(ai.trend)}`}>
                {ai.trend}
              </span>
            )}
          </div>
          {ai.trend_reason && <p className="text-xs text-muted-foreground mb-2 italic">{ai.trend_reason}</p>}
          <p className="text-sm text-foreground/85 leading-relaxed">{ai.future_prediction}</p>
          {ai.code_quality && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Chất lượng mã</span>
                <span className="text-xs font-mono text-accent">{ai.code_quality.score}/100</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${ai.code_quality.score}%`, background: `linear-gradient(90deg, ${COLORS[3]}, ${COLORS[1]})` }}
                />
              </div>
              <p className="text-xs text-foreground/70">{ai.code_quality.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RepoCharts;

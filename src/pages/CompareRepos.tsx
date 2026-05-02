import { useState, useEffect } from "react";
import { ArrowLeft, X, Star, GitFork, AlertCircle, Clock, BarChart3, Users, GitPullRequest, Activity, Scale, Sparkles, Loader2, Trophy, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";
import type { RepoInfo } from "@/lib/github";

interface Enriched {
  fullName: string;
  contributors: number;
  openPRs: number;
  closedPRs: number;
  totalCommits52w: number;
  recentCommits4w: number;
  license: string;
  defaultBranch: string;
  size: number;
  watchers: number;
}

const CompareRepos = () => {
  const [allRepos, setAllRepos] = useState<(RepoInfo & { uuid: string })[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [enriched, setEnriched] = useState<Record<string, Enriched>>({});
  const [verdict, setVerdict] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch enriched + AI verdict whenever selection changes (>=2)
  useEffect(() => {
    const sel = selectedIds.map(id => allRepos.find(r => r.uuid === id)).filter(Boolean) as (RepoInfo & { uuid: string })[];
    if (sel.length < 2) {
      setVerdict(null);
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    supabase.functions.invoke("compare-repos-data", {
      body: {
        repos: sel.map(r => ({
          fullName: r.full_name,
          name: r.name,
          stars: r.stargazers_count,
          forks: r.forks_count,
          issues: r.open_issues_count,
          language: r.language,
          description: r.description,
        })),
      },
    }).then(({ data, error }) => {
      if (cancelled || error || !data) {
        setAiLoading(false);
        return;
      }
      const map: Record<string, Enriched> = {};
      (data.enriched || []).forEach((e: Enriched) => { map[e.fullName] = e; });
      setEnriched(prev => ({ ...prev, ...map }));
      setVerdict(data.verdict);
      setAiLoading(false);
    }).catch(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [selectedIds, allRepos]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("saved_repos").select("*").order("stargazers_count", { ascending: false });
      if (data) {
        setAllRepos(data.map(r => ({
          id: r.github_id, uuid: r.id, name: r.name, full_name: r.full_name,
          description: r.description, html_url: r.html_url,
          stargazers_count: r.stargazers_count, forks_count: r.forks_count,
          language: r.language, owner: { login: r.owner_login, avatar_url: r.owner_avatar_url },
          topics: r.topics || [], updated_at: r.updated_at, open_issues_count: r.open_issues_count,
        })));
      }
    };
    load();
  }, []);

  const selected = selectedIds.map(id => allRepos.find(r => r.uuid === id)).filter(Boolean) as (RepoInfo & { uuid: string })[];

  const addRepo = (uuid: string) => {
    if (selectedIds.length >= 3 || selectedIds.includes(uuid)) return;
    setSelectedIds(prev => [...prev, uuid]);
  };

  const removeRepo = (uuid: string) => {
    setSelectedIds(prev => prev.filter(id => id !== uuid));
  };

  const maxStars = Math.max(...selected.map(r => r.stargazers_count), 1);
  const maxForks = Math.max(...selected.map(r => r.forks_count), 1);
  const maxIssues = Math.max(...selected.map(r => r.open_issues_count), 1);

  const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(145 60% 50%)"];

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <BarChart3 className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">So Sánh Repo</h1>
        <div className="flex-1" />
        <NotificationBell />
        <UserMenu />
      </header>

      <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Selector */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select onValueChange={addRepo} value="">
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder={`Chọn repo (${selectedIds.length}/3)...`} />
              </SelectTrigger>
              <SelectContent>
                {allRepos
                  .filter(r => !selectedIds.includes(r.uuid))
                  .map(r => (
                    <SelectItem key={r.uuid} value={r.uuid}>{r.full_name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected chips */}
        <div className="flex gap-2 flex-wrap">
          {selected.map((repo, i) => (
            <div key={repo.uuid} className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: colors[i] }}>
              <img src={repo.owner.avatar_url} className="w-5 h-5 rounded-full" alt="" />
              <span className="text-sm font-medium">{repo.name}</span>
              <button onClick={() => removeRepo(repo.uuid)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {selected.length < 2 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Chọn ít nhất 2 repo để so sánh</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats comparison */}
            <div className="glow-card rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Thống kê</h2>

              {/* Stars */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4" /> Stars
                </div>
                {selected.map((repo, i) => (
                  <div key={repo.uuid} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 flex items-center px-2"
                        style={{ width: `${(repo.stargazers_count / maxStars) * 100}%`, background: colors[i] }}
                      >
                        <span className="text-xs font-mono text-primary-foreground">{repo.stargazers_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Forks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitFork className="w-4 h-4" /> Forks
                </div>
                {selected.map((repo, i) => (
                  <div key={repo.uuid} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 flex items-center px-2"
                        style={{ width: `${(repo.forks_count / maxForks) * 100}%`, background: colors[i] }}
                      >
                        <span className="text-xs font-mono text-primary-foreground">{repo.forks_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Issues */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" /> Open Issues
                </div>
                {selected.map((repo, i) => (
                  <div key={repo.uuid} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 flex items-center px-2"
                        style={{ width: `${(repo.open_issues_count / maxIssues) * 100}%`, background: colors[i] }}
                      >
                        <span className="text-xs font-mono text-primary-foreground">{repo.open_issues_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contributors */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" /> Contributors (top 100+)
                </div>
                {selected.map((repo, i) => {
                  const e = enriched[repo.full_name];
                  const max = Math.max(...selected.map(r => enriched[r.full_name]?.contributors || 0), 1);
                  return (
                    <div key={repo.uuid} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                      <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 flex items-center px-2"
                          style={{ width: `${((e?.contributors || 0) / max) * 100}%`, background: colors[i] }}>
                          <span className="text-xs font-mono text-primary-foreground">{e ? `${e.contributors}+` : "..."}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commits last 52w */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" /> Tần suất commit (52 tuần)
                </div>
                {selected.map((repo, i) => {
                  const e = enriched[repo.full_name];
                  const max = Math.max(...selected.map(r => enriched[r.full_name]?.totalCommits52w || 0), 1);
                  return (
                    <div key={repo.uuid} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                      <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 flex items-center px-2"
                          style={{ width: `${((e?.totalCommits52w || 0) / max) * 100}%`, background: colors[i] }}>
                          <span className="text-xs font-mono text-primary-foreground">{e ? e.totalCommits52w.toLocaleString() : "..."}</span>
                        </div>
                      </div>
                      {e && (
                        <span className="text-[10px] text-muted-foreground w-20 text-right">
                          {e.recentCommits4w}/4w gần nhất
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PRs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitPullRequest className="w-4 h-4" /> Pull Requests (open / closed)
                </div>
                {selected.map((repo, i) => {
                  const e = enriched[repo.full_name];
                  return (
                    <div key={repo.uuid} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                      <span className="text-sm font-mono" style={{ color: colors[i] }}>
                        {e ? `${e.openPRs} open • ${e.closedPRs} closed` : "..."}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* License */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Scale className="w-4 h-4" /> Giấy phép
                </div>
                {selected.map((repo, i) => {
                  const e = enriched[repo.full_name];
                  return (
                    <div key={repo.uuid} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                      <span className="text-sm font-medium px-2 py-0.5 rounded bg-muted/40" style={{ color: colors[i] }}>
                        {e?.license || "..."}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Updated */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> Cập nhật gần nhất
                </div>
                {selected.map((repo, i) => (
                  <div key={repo.uuid} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate text-muted-foreground">{repo.name}</span>
                    <span className="text-sm font-medium" style={{ color: colors[i] }}>
                      {new Date(repo.updated_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Verdict */}
            <div className="glow-card rounded-xl p-6 border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent animate-pulse-glow" />
                <h2 className="text-lg font-semibold neon-text">Phân tích AI</h2>
                {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
              </div>
              {!verdict && !aiLoading && (
                <p className="text-sm text-muted-foreground">Đang chờ dữ liệu AI...</p>
              )}
              {verdict && (
                <div className="space-y-4">
                  {verdict.winner && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <Trophy className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-accent">Nổi bật nhất: {verdict.winner}</div>
                        {verdict.reason && <p className="text-xs text-foreground/80 mt-1">{verdict.reason}</p>}
                      </div>
                    </div>
                  )}
                  {verdict.summaries?.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {verdict.summaries.map((s: any, i: number) => (
                        <div key={s.fullName} className="p-3 rounded-lg bg-muted/20 border-l-2" style={{ borderColor: colors[i] }}>
                          <div className="text-xs font-semibold mb-1" style={{ color: colors[i] }}>{s.fullName}</div>
                          <p className="text-xs text-foreground/80 mb-2">{s.summary}</p>
                          {s.best_for && (
                            <div className="text-[10px] text-muted-foreground">
                              <span className="text-accent">Phù hợp: </span>{s.best_for}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detail table */}
            <div className="glow-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Thuộc tính</th>
                    {selected.map((repo, i) => (
                      <th key={repo.uuid} className="text-left p-4 font-semibold" style={{ color: colors[i] }}>{repo.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Owner", get: (r: RepoInfo) => r.owner.login },
                    { label: "Language", get: (r: RepoInfo) => r.language || "N/A" },
                    { label: "Stars", get: (r: RepoInfo) => r.stargazers_count.toLocaleString() },
                    { label: "Forks", get: (r: RepoInfo) => r.forks_count.toLocaleString() },
                    { label: "Watchers", get: (r: RepoInfo) => enriched[r.full_name]?.watchers?.toLocaleString() ?? "—" },
                    { label: "Issues", get: (r: RepoInfo) => r.open_issues_count.toLocaleString() },
                    { label: "Open PRs", get: (r: RepoInfo) => enriched[r.full_name]?.openPRs?.toLocaleString() ?? "—" },
                    { label: "Closed PRs", get: (r: RepoInfo) => enriched[r.full_name]?.closedPRs?.toLocaleString() ?? "—" },
                    { label: "Contributors", get: (r: RepoInfo) => enriched[r.full_name] ? `${enriched[r.full_name].contributors}+` : "—" },
                    { label: "Commits / 52w", get: (r: RepoInfo) => enriched[r.full_name]?.totalCommits52w?.toLocaleString() ?? "—" },
                    { label: "License", get: (r: RepoInfo) => enriched[r.full_name]?.license ?? "—" },
                    { label: "Default Branch", get: (r: RepoInfo) => enriched[r.full_name]?.defaultBranch ?? "—" },
                    { label: "Size (KB)", get: (r: RepoInfo) => enriched[r.full_name]?.size?.toLocaleString() ?? "—" },
                    { label: "Cập nhật", get: (r: RepoInfo) => new Date(r.updated_at).toLocaleDateString("vi-VN") },
                    { label: "Topics", get: (r: RepoInfo) => r.topics?.slice(0, 3).join(", ") || "—" },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-border/30 last:border-0">
                      <td className="p-4 text-muted-foreground">{row.label}</td>
                      {selected.map(repo => (
                        <td key={repo.uuid} className="p-4 text-foreground">{row.get(repo)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareRepos;

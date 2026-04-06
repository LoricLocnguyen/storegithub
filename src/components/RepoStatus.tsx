import { useState, useEffect } from "react";
import { GitCommit, Tag, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepoStatusData {
  lastCommit?: { message: string; date: string; author: string; sha: string };
  latestRelease?: { tag: string; name: string; date: string; url: string };
  workflowStatus?: { name: string; status: string; conclusion: string | null };
}

interface RepoStatusProps {
  owner: string;
  repo: string;
}

const RepoStatus = ({ owner, repo }: RepoStatusProps) => {
  const [data, setData] = useState<RepoStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [commitsRes, releasesRes, workflowsRes] = await Promise.allSettled([
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`),
      ]);

      const result: RepoStatusData = {};

      if (commitsRes.status === "fulfilled" && commitsRes.value.ok) {
        const commits = await commitsRes.value.json();
        if (commits[0]) {
          result.lastCommit = {
            message: commits[0].commit.message.split("\n")[0],
            date: commits[0].commit.author.date,
            author: commits[0].commit.author.name,
            sha: commits[0].sha.slice(0, 7),
          };
        }
      }

      if (releasesRes.status === "fulfilled" && releasesRes.value.ok) {
        const release = await releasesRes.value.json();
        result.latestRelease = {
          tag: release.tag_name,
          name: release.name || release.tag_name,
          date: release.published_at,
          url: release.html_url,
        };
      }

      if (workflowsRes.status === "fulfilled" && workflowsRes.value.ok) {
        const workflows = await workflowsRes.value.json();
        if (workflows.workflow_runs?.[0]) {
          const run = workflows.workflow_runs[0];
          result.workflowStatus = {
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
          };
        }
      }

      setData(result);
    } catch {
      setError("Không thể tải trạng thái");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [owner, repo]);

  const CIBadge = () => {
    if (!data?.workflowStatus) return <span className="text-xs text-muted-foreground">Không có CI/CD</span>;
    const { conclusion, status } = data.workflowStatus;
    if (status === "in_progress") return <span className="flex items-center gap-1 text-xs text-yellow-500"><Loader2 className="w-3 h-3 animate-spin" /> Đang chạy</span>;
    if (conclusion === "success") return <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> Passed</span>;
    if (conclusion === "failure") return <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="w-3 h-3" /> Failed</span>;
    return <span className="text-xs text-muted-foreground">{conclusion || status}</span>;
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải trạng thái...</div>;
  if (error) return <div className="text-sm text-destructive">{error}</div>;
  if (!data) return null;

  return (
    <div className="glow-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Trạng thái Repo</h3>
        <Button variant="ghost" size="sm" onClick={fetchStatus} className="h-7 w-7 p-0">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CI/CD */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">CI/CD</p>
          <CIBadge />
          {data.workflowStatus && <p className="text-[10px] text-muted-foreground truncate">{data.workflowStatus.name}</p>}
        </div>

        {/* Latest Release */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Phiên bản mới nhất</p>
          {data.latestRelease ? (
            <>
              <a href={data.latestRelease.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Tag className="w-3 h-3" /> {data.latestRelease.tag}
              </a>
              <p className="text-[10px] text-muted-foreground">{new Date(data.latestRelease.date).toLocaleDateString("vi-VN")}</p>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có release</span>
          )}
        </div>

        {/* Last Commit */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Commit cuối</p>
          {data.lastCommit ? (
            <>
              <p className="flex items-center gap-1 text-xs text-foreground">
                <GitCommit className="w-3 h-3 text-primary shrink-0" />
                <span className="font-mono text-[10px] text-primary">{data.lastCommit.sha}</span>
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{data.lastCommit.message}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(data.lastCommit.date).toLocaleDateString("vi-VN")}
              </p>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoStatus;

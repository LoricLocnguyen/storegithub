import { Star, GitFork, ExternalLink, AlertCircle, Code2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RepoInfo } from "@/lib/github";

const langColors: Record<string, string> = {
  TypeScript: "hsl(210 100% 55%)",
  JavaScript: "hsl(50 90% 55%)",
  Python: "hsl(210 60% 50%)",
  Rust: "hsl(25 80% 55%)",
  Go: "hsl(195 70% 50%)",
  Java: "hsl(20 80% 50%)",
  "C++": "hsl(340 70% 55%)",
  C: "hsl(200 50% 45%)",
  Ruby: "hsl(0 70% 50%)",
  PHP: "hsl(240 50% 60%)",
  Swift: "hsl(15 90% 55%)",
  Kotlin: "hsl(265 60% 55%)",
  Dart: "hsl(195 80% 50%)",
  HTML: "hsl(15 80% 55%)",
  CSS: "hsl(265 50% 55%)",
  Shell: "hsl(120 40% 45%)",
  Vue: "hsl(153 60% 50%)",
};

interface RepoCardProps {
  repo: RepoInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function RepoCard({ repo, isSelected, onClick }: RepoCardProps) {
  const dotColor = repo.language ? langColors[repo.language] || "hsl(var(--muted-foreground))" : undefined;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-300 glow-card ${
        isSelected ? "neon-border !border-primary/60 !shadow-[0_0_24px_hsl(265_90%_65%/0.2)]" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-8 h-8 rounded-full ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{repo.name}</p>
          <p className="text-xs text-muted-foreground">{repo.owner.login}</p>
        </div>
      </div>

      {repo.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{repo.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {repo.forks_count.toLocaleString()}
        </span>
      </div>
    </button>
  );
}

interface RepoDetailProps {
  repo: RepoInfo;
}

export function RepoDetail({ repo }: RepoDetailProps) {
  const dotColor = repo.language ? langColors[repo.language] || "hsl(var(--muted-foreground))" : undefined;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-16 h-16 rounded-xl ring-2 ring-border animate-float"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold neon-text truncate">{repo.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">by {repo.owner.login}</p>
        </div>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          GitHub
        </a>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-foreground/80 text-base leading-relaxed mb-8">{repo.description}</p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Stars", value: repo.stargazers_count.toLocaleString(), icon: Star },
          { label: "Forks", value: repo.forks_count.toLocaleString(), icon: GitFork },
          { label: "Issues", value: repo.open_issues_count.toLocaleString(), icon: AlertCircle },
          { label: "Language", value: repo.language || "N/A", icon: Code2 },
        ].map((stat) => (
          <div key={stat.label} className="glow-card rounded-xl p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Language badge */}
      {repo.language && (
        <div className="flex items-center gap-2 mb-6">
          <span className="w-3 h-3 rounded-full" style={{ background: dotColor }} />
          <span className="text-sm font-medium text-foreground">{repo.language}</span>
        </div>
      )}

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {repo.topics.map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Updated */}
      <p className="text-xs text-muted-foreground mt-8">
        Cập nhật lần cuối: {new Date(repo.updated_at).toLocaleDateString("vi-VN")}
      </p>
    </div>
  );
}

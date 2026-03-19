export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
  updated_at: string;
  open_issues_count: number;
}

export async function fetchRepoInfo(url: string): Promise<RepoInfo> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repo] = match;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}`);
  if (!res.ok) throw new Error(`Failed to fetch repo: ${res.status}`);
  return res.json();
}

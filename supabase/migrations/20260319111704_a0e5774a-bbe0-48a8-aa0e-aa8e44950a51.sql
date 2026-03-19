
-- Create table to store saved repos
CREATE TABLE public.saved_repos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  stargazers_count INT NOT NULL DEFAULT 0,
  forks_count INT NOT NULL DEFAULT 0,
  language TEXT,
  owner_login TEXT NOT NULL,
  owner_avatar_url TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  open_issues_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_repos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert/delete (no auth yet)
CREATE POLICY "Anyone can view repos" ON public.saved_repos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert repos" ON public.saved_repos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete repos" ON public.saved_repos FOR DELETE USING (true);

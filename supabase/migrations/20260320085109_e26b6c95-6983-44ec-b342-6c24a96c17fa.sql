
CREATE TABLE public.airdrop_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  website_url text,
  logo_url text,
  status text NOT NULL DEFAULT 'running',
  blockchain text,
  start_date date,
  end_date date,
  guide text,
  estimated_value text,
  difficulty text DEFAULT 'medium',
  funding text,
  twitter_url text,
  discord_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.airdrop_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view airdrop projects" ON public.airdrop_projects FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert airdrop projects" ON public.airdrop_projects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update airdrop projects" ON public.airdrop_projects FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete airdrop projects" ON public.airdrop_projects FOR DELETE TO public USING (true);

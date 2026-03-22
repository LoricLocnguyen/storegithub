CREATE TABLE public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  website_url text,
  logo_url text,
  category text,
  pricing text,
  status text NOT NULL DEFAULT 'active',
  popularity text DEFAULT 'emerging',
  features text,
  use_cases text,
  twitter_url text,
  discord_url text,
  github_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai_tools" ON public.ai_tools FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert ai_tools" ON public.ai_tools FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete ai_tools" ON public.ai_tools FOR DELETE TO public USING (true);
CREATE POLICY "Anyone can update ai_tools" ON public.ai_tools FOR UPDATE TO public USING (true) WITH CHECK (true);
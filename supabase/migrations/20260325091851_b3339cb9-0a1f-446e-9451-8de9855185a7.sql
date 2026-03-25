
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  drawing_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  linked_type text DEFAULT NULL,
  linked_id text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notes" ON public.notes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert notes" ON public.notes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update notes" ON public.notes FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete notes" ON public.notes FOR DELETE TO public USING (true);

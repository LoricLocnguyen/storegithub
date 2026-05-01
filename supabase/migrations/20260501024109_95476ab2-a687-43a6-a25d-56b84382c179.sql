-- Roadmaps table
CREATE TABLE public.roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_markdown TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public roadmaps viewable by everyone"
ON public.roadmaps FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users create own roadmaps"
ON public.roadmaps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own roadmaps"
ON public.roadmaps FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own roadmaps"
ON public.roadmaps FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_roadmaps_updated_at
BEFORE UPDATE ON public.roadmaps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Roadmap items
CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'repo',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  ref_repo_id UUID,
  ref_tool_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items viewable if roadmap viewable"
ON public.roadmap_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.roadmaps r WHERE r.id = roadmap_items.roadmap_id AND (r.is_public = true OR auth.uid() = r.user_id)));

CREATE POLICY "Owners insert items"
ON public.roadmap_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.roadmaps r WHERE r.id = roadmap_items.roadmap_id AND auth.uid() = r.user_id));

CREATE POLICY "Owners update items"
ON public.roadmap_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.roadmaps r WHERE r.id = roadmap_items.roadmap_id AND auth.uid() = r.user_id));

CREATE POLICY "Owners delete items"
ON public.roadmap_items FOR DELETE
USING (EXISTS (SELECT 1 FROM public.roadmaps r WHERE r.id = roadmap_items.roadmap_id AND auth.uid() = r.user_id));

-- Votes
CREATE TABLE public.roadmap_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (roadmap_id, user_id)
);

ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by everyone"
ON public.roadmap_votes FOR SELECT USING (true);

CREATE POLICY "Auth users vote"
ON public.roadmap_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unvote own"
ON public.roadmap_votes FOR DELETE
USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.roadmap_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
ON public.roadmap_comments FOR SELECT USING (true);

CREATE POLICY "Auth users comment"
ON public.roadmap_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own comments"
ON public.roadmap_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own comments"
ON public.roadmap_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_roadmap_comments_updated_at
BEFORE UPDATE ON public.roadmap_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_roadmap_items_roadmap ON public.roadmap_items(roadmap_id, position);
CREATE INDEX idx_roadmap_votes_roadmap ON public.roadmap_votes(roadmap_id);
CREATE INDEX idx_roadmap_comments_roadmap ON public.roadmap_comments(roadmap_id);
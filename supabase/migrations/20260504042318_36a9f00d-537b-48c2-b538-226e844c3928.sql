
-- Edit suggestions for crowdsourcing updates to airdrop_projects and ai_tools
CREATE TABLE public.edit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('airdrop','tool')),
  target_id uuid NOT NULL,
  target_name text,
  proposed_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  applied_by uuid,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.edit_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suggestions viewable by everyone" ON public.edit_suggestions FOR SELECT USING (true);
CREATE POLICY "Auth users create suggestions" ON public.edit_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users update suggestions" ON public.edit_suggestions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owners delete suggestions" ON public.edit_suggestions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER edit_suggestions_updated_at
BEFORE UPDATE ON public.edit_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Votes
CREATE TABLE public.edit_suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);
ALTER TABLE public.edit_suggestion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.edit_suggestion_votes FOR SELECT USING (true);
CREATE POLICY "Auth users vote" ON public.edit_suggestion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unvote own" ON public.edit_suggestion_votes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_edit_suggestions_status ON public.edit_suggestions(status);
CREATE INDEX idx_edit_suggestions_target ON public.edit_suggestions(target_type, target_id);

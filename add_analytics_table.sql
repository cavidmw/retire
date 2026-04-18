-- SQL for Analytics
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  path text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast time-based and visitor-based queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_path ON public.page_views(visitor_hash, path);

-- RLS Policies
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage page_views" ON public.page_views;
CREATE POLICY "Service role can manage page_views"
ON public.page_views
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

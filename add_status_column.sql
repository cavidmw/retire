-- posts tablosuna status kolonunu ekler (eğer yoksa)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- Mevcut satırların null kalmaması için (opsiyonel)
UPDATE public.posts SET status = 'published' WHERE status IS NULL;

-- Run once in the existing What's Poppin? Supabase SQL Editor.
-- Lets users revise their own previously published review cards, not someone else's.
-- Keeps existing public read and owner insert/delete policies intact.

DROP POLICY IF EXISTS wp_reviews_owner_update ON public.wp_review_cards;
CREATE POLICY wp_reviews_owner_update ON public.wp_review_cards
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()) AND card_path LIKE (select auth.uid())::text || '/%');

DROP POLICY IF EXISTS wp_card_update ON storage.objects;
CREATE POLICY wp_card_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'wp-review-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text)
  WITH CHECK (bucket_id = 'wp-review-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text);

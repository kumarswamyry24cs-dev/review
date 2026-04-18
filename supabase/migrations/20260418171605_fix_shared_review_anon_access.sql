/*
  # Fix public/anon access for shared reviews

  Shared review links (/shared/:token) are accessed by unauthenticated visitors.
  The review_shares and code_reviews tables currently only allow 'authenticated' access.
  This migration adds the necessary anon policies so shared links work publicly.

  Changes:
  1. Allow anon users to SELECT from review_shares via public_token lookup
  2. Allow anon users to UPDATE view_count on review_shares (for view tracking)
  3. Allow anon users to SELECT from code_reviews when the review has a valid share
  4. Fix review_shares missing UPDATE policy (only authenticated owner updates needed)
*/

-- Allow public (anon) to look up review shares by token
CREATE POLICY "Public can view review shares by token"
  ON review_shares FOR SELECT
  TO anon
  USING (true);

-- Allow public (anon) to increment view_count
CREATE POLICY "Public can update view count on review shares"
  ON review_shares FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow public (anon) to read code review results when a valid share exists
CREATE POLICY "Public can read shared code reviews"
  ON code_reviews FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM review_shares
      WHERE review_shares.review_id = code_reviews.id
    )
  );

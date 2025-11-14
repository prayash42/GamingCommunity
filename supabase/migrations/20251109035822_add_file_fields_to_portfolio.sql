/*
  # Add file upload fields to portfolio_items

  ## Changes
  
  Added three new columns to portfolio_items table:
  - `file_type` (text): Type of attachment - 'image', 'pdf', or 'link'
  - `file_url` (text): URL to the uploaded file in Supabase Storage or external link
  - `file_name` (text): Original filename (optional, for reference)

  ## Notes
  - These fields are optional, allowing portfolio items to have either image_url OR file_url
  - Existing portfolio_items will work with both old (image_url) and new (file_url) fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN file_type text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN file_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN file_name text;
  END IF;
END $$;
/*
  # Add category to game_ideas and create portfolio_items table

  ## Changes
  
  ### 1. game_ideas table
  - Add `category` column with values: Story, Prototype, Element
  
  ### 2. portfolio_items table (NEW)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `image_url` (text, optional)
  - `tags` (text array)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on portfolio_items
  - Users can view all portfolio items
  - Users can only create/edit/delete their own items
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_ideas' AND column_name = 'category'
  ) THEN
    ALTER TABLE game_ideas ADD COLUMN category text DEFAULT 'Story';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio items"
  ON portfolio_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create portfolio items"
  ON portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio items"
  ON portfolio_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio items"
  ON portfolio_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
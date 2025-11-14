/*
  # GameSocio Demo Database Schema

  ## Overview
  Creates the complete database structure for GameSocio - a community platform for game creators and enthusiasts.

  ## New Tables
  
  ### 1. profiles
  Extended user profile information
  - `id` (uuid, references auth.users)
  - `username` (text, unique)
  - `avatar_url` (text, optional)
  - `bio` (text, optional)
  - `badges` (text array for achievements like "Trusted Editor")
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. game_ideas
  Game concepts and storylines shared by creators
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `title` (text)
  - `genre` (text)
  - `summary` (text)
  - `tags` (text array)
  - `file_url` (text, optional)
  - `upvotes` (integer)
  - `view_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. demo_requests
  Requests for full demo access
  - `id` (uuid, primary key)
  - `idea_id` (uuid, references game_ideas)
  - `requester_id` (uuid, references profiles)
  - `status` (text: pending, approved, rejected)
  - `message` (text, optional)
  - `created_at` (timestamptz)

  ### 4. idea_comments
  Comments on game ideas
  - `id` (uuid, primary key)
  - `idea_id` (uuid, references game_ideas)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)

  ### 5. media_posts
  IGN-like community articles and content
  - `id` (uuid, primary key)
  - `author_id` (uuid, references profiles)
  - `title` (text)
  - `content` (text)
  - `category` (text: Reviews, Game News, Devlogs, Opinion)
  - `image_url` (text, optional)
  - `upvotes` (integer)
  - `view_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. media_comments
  Comments on media posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, references media_posts)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)

  ### 7. events
  eSports tournaments, hackathons, and challenges
  - `id` (uuid, primary key)
  - `organizer_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `event_type` (text: Tournament, Hackathon, CSR Challenge)
  - `location` (text)
  - `is_online` (boolean)
  - `event_date` (timestamptz)
  - `registration_url` (text, optional)
  - `tags` (text array)
  - `created_at` (timestamptz)

  ### 8. projects
  Game prototypes and progress logs for collaboration
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `stage` (text: Idea, Prototype, Beta, Released)
  - `image_url` (text, optional)
  - `rating_sum` (integer)
  - `rating_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. project_feedback
  Feedback on projects
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `rating` (integer, 1-5)
  - `created_at` (timestamptz)

  ### 10. collaborator_requests
  Available roles for collaboration
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `role_type` (text: Artist, Sound Designer, Coder, Writer)
  - `description` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Authenticated users can read all content
  - Users can only modify/delete their own content
  - Users can create comments, requests, and feedback
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  badges text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create game_ideas table
CREATE TABLE IF NOT EXISTS game_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  genre text NOT NULL,
  summary text NOT NULL,
  tags text[] DEFAULT '{}',
  file_url text,
  upvotes integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game ideas"
  ON game_ideas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create game ideas"
  ON game_ideas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own ideas"
  ON game_ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own ideas"
  ON game_ideas FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create demo_requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES game_ideas(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON demo_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() IN (SELECT creator_id FROM game_ideas WHERE id = idea_id));

CREATE POLICY "Users can create demo requests"
  ON demo_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Create idea_comments table
CREATE TABLE IF NOT EXISTS idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES game_ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON idea_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON idea_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON idea_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create media_posts table
CREATE TABLE IF NOT EXISTS media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  image_url text,
  upvotes integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media posts"
  ON media_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create media posts"
  ON media_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON media_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON media_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create media_comments table
CREATE TABLE IF NOT EXISTS media_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES media_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media comments"
  ON media_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create media comments"
  ON media_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media comments"
  ON media_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL,
  location text NOT NULL,
  is_online boolean DEFAULT false,
  event_date timestamptz NOT NULL,
  registration_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = organizer_id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  stage text DEFAULT 'Idea',
  image_url text,
  rating_sum integer DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create project_feedback table
CREATE TABLE IF NOT EXISTS project_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback"
  ON project_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create feedback"
  ON project_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON project_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create collaborator_requests table
CREATE TABLE IF NOT EXISTS collaborator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaborator_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collaborator requests"
  ON collaborator_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project creators can create requests"
  ON collaborator_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT creator_id FROM projects WHERE id = project_id));

CREATE POLICY "Project creators can delete requests"
  ON collaborator_requests FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT creator_id FROM projects WHERE id = project_id));
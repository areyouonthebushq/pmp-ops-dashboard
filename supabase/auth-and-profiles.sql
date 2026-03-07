-- PMP OPS — Auth & profiles (run after schema.sql)
-- Enables email/password auth and a lightweight profile per user for future role use.
-- Run in Supabase SQL Editor.

-- Profiles: one row per auth user (id = auth.uid())
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text CHECK (role IS NULL OR role IN ('admin', 'floor_manager', 'press', 'qc')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: users can read/update own profile only
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert on signup: create profile from auth.users (trigger runs as service role so INSERT is allowed)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: backfill existing auth users into profiles (run once if you already have users)
-- INSERT INTO public.profiles (id, email, display_name, role)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), NULL
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

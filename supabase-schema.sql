-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'cancelled')),
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create decks table
CREATE TABLE decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('known', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table for analytics
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_deck_id ON study_sessions(deck_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for decks
CREATE POLICY "Users can view own decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks" ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards from own decks" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flashcards to own decks" ON flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards in own decks" ON flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards from own decks" ON flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Create RLS policies for study_sessions
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Demo data will be created automatically when users sign up
-- The handle_new_user() trigger will create profiles for new users

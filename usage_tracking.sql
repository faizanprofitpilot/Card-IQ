-- Add usage tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS decks_created_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tokens_processed_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create usage tracking table for detailed logs
CREATE TABLE usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('deck_created', 'tokens_processed', 'flashcard_generated')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX idx_usage_tracking_action_type ON usage_tracking(action_type);

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    decks_created_this_month = 0,
    tokens_processed_this_month = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create deck
CREATE OR REPLACE FUNCTION can_create_deck(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  decks_created INTEGER;
BEGIN
  SELECT subscription_status, decks_created_this_month 
  INTO user_plan, decks_created
  FROM profiles 
  WHERE id = user_id_param;
  
  IF user_plan = 'pro' THEN
    RETURN TRUE; -- Unlimited for pro users
  ELSE
    RETURN decks_created < 5; -- Free users limited to 5 decks
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can process tokens
CREATE OR REPLACE FUNCTION can_process_tokens(user_id_param UUID, token_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  tokens_processed INTEGER;
  monthly_limit INTEGER;
BEGIN
  SELECT subscription_status, tokens_processed_this_month 
  INTO user_plan, tokens_processed
  FROM profiles 
  WHERE id = user_id_param;
  
  IF user_plan = 'pro' THEN
    monthly_limit := 1000000; -- 1 million tokens for pro
  ELSE
    monthly_limit := 50000; -- 50k tokens for free
  END IF;
  
  RETURN (tokens_processed + token_count) <= monthly_limit;
END;
$$ LANGUAGE plpgsql;

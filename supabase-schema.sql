-- Complete Database Schema for FollowUp Tool with Multi-User & Batch System
-- Run ALL of this in Supabase SQL Editor

-- ========== DROP OLD TABLES IF EXISTS ==========
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ========== CREATE BATCHES TABLE ==========
CREATE TABLE batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_leads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== CREATE LEADS TABLE ==========
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(255),
  age VARCHAR(50),
  job VARCHAR(255),
  status VARCHAR(50) DEFAULT 'belum',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== CREATE TEMPLATES TABLE ==========
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== CREATE USER PROFILES TABLE ==========
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_batches_user ON batches(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_batch ON leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

-- ========== ENABLE ROW LEVEL SECURITY ==========
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ========== DROP OLD POLICIES IF EXISTS ==========
DROP POLICY IF EXISTS "batches_select" ON batches;
DROP POLICY IF EXISTS "batches_insert" ON batches;
DROP POLICY IF EXISTS "batches_update" ON batches;
DROP POLICY IF EXISTS "batches_delete" ON batches;

DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

DROP POLICY IF EXISTS "templates_select" ON templates;
DROP POLICY IF EXISTS "templates_insert" ON templates;
DROP POLICY IF EXISTS "templates_update" ON templates;
DROP POLICY IF EXISTS "templates_delete" ON templates;

DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "profiles_update" ON user_profiles;

-- ========== CREATE NEW RLS POLICIES ==========

-- Batches
CREATE POLICY "batches_select" ON batches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "batches_insert" ON batches FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "batches_update" ON batches FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "batches_delete" ON batches FOR DELETE USING (user_id = auth.uid());

-- Leads
CREATE POLICY "leads_select" ON leads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (user_id = auth.uid());

-- Templates
CREATE POLICY "templates_select" ON templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "templates_insert" ON templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "templates_update" ON templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "templates_delete" ON templates FOR DELETE USING (user_id = auth.uid());

-- User profiles
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (user_id = auth.uid());

-- ========== TRIGGER FOR updated_at ==========
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========== AUTO-CREATE USER PROFILE ON SIGNUP ==========
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
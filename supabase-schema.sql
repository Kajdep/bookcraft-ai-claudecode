-- =====================================================
-- BookCraft AI - Supabase Database Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all necessary tables, indexes, and RLS policies
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    description TEXT,
    target_word_count INTEGER DEFAULT 0,
    current_word_count INTEGER DEFAULT 0,
    cover_image_url TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    "order" INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    word_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Research Items Table
CREATE TABLE IF NOT EXISTS research_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    source_url TEXT,
    confidence TEXT,
    verified BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    folder_id TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Materials Table
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_id TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    folder_id TEXT,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Citations Table
CREATE TABLE IF NOT EXISTS citations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL,
    style TEXT NOT NULL,
    formatted_citation TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writing Sessions Table
CREATE TABLE IF NOT EXISTS writing_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    words_written INTEGER DEFAULT 0,
    words_deleted INTEGER DEFAULT 0,
    net_words INTEGER DEFAULT 0,
    keystrokes INTEGER DEFAULT 0,
    backspaces INTEGER DEFAULT 0,
    time_active INTEGER DEFAULT 0,
    time_idle INTEGER DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writing Goals Table
CREATE TABLE IF NOT EXISTS writing_goals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    target INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Metrics Table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    words INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    words_deleted INTEGER DEFAULT 0,
    efficiency REAL DEFAULT 0,
    focus INTEGER DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Generated Images Table
CREATE TABLE IF NOT EXISTS generated_images (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    base64_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_modified ON projects(last_modified DESC);

CREATE INDEX IF NOT EXISTS idx_chapters_project_id ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters("order");
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

CREATE INDEX IF NOT EXISTS idx_research_items_project_id ON research_items(project_id);
CREATE INDEX IF NOT EXISTS idx_research_items_type ON research_items(type);
CREATE INDEX IF NOT EXISTS idx_research_items_folder_id ON research_items(folder_id);

CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_folder_id ON materials(folder_id);

CREATE INDEX IF NOT EXISTS idx_writing_sessions_project_id ON writing_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_start_time ON writing_sessions(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_writing_goals_project_id ON writing_goals(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_goals_completed ON writing_goals(completed);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Chapters Policies
CREATE POLICY "Users can view chapters of their projects" ON chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chapters.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chapters in their projects" ON chapters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chapters.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update chapters of their projects" ON chapters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chapters.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chapters of their projects" ON chapters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chapters.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Research Items Policies
CREATE POLICY "Users can view research of their projects" ON research_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = research_items.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create research in their projects" ON research_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = research_items.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update research of their projects" ON research_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = research_items.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete research of their projects" ON research_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = research_items.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Materials Policies
CREATE POLICY "Users can view materials of their projects" ON materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = materials.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create materials in their projects" ON materials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = materials.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update materials of their projects" ON materials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = materials.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete materials of their projects" ON materials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = materials.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Citations Policies (same pattern as above)
CREATE POLICY "Users can view citations of their projects" ON citations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = citations.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can create citations in their projects" ON citations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = citations.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can update citations of their projects" ON citations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = citations.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can delete citations of their projects" ON citations
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = citations.project_id AND projects.user_id = auth.uid())
    );

-- Writing Sessions Policies
CREATE POLICY "Users can view sessions of their projects" ON writing_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_sessions.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can create sessions in their projects" ON writing_sessions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_sessions.project_id AND projects.user_id = auth.uid())
    );

-- Writing Goals Policies
CREATE POLICY "Users can view goals of their projects" ON writing_goals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_goals.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can create goals in their projects" ON writing_goals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_goals.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can update goals of their projects" ON writing_goals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_goals.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can delete goals of their projects" ON writing_goals
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = writing_goals.project_id AND projects.user_id = auth.uid())
    );

-- Daily Metrics Policies
CREATE POLICY "Users can view their own metrics" ON daily_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" ON daily_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics" ON daily_metrics
    FOR UPDATE USING (auth.uid() = user_id);

-- Generated Images Policies
CREATE POLICY "Users can view images of their projects" ON generated_images
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can create images in their projects" ON generated_images
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid())
    );

CREATE POLICY "Users can delete images of their projects" ON generated_images
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid())
    );

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user files
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating last_modified
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_items_updated_at BEFORE UPDATE ON research_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- Then your database will be ready for BookCraft AI!
-- =====================================================

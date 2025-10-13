/*
  # BookCraft AI Initial Database Schema

  1. New Tables
    - `projects` - User book projects
      - `id` (text, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `genre` (text)
      - `description` (text)
      - `target_word_count` (integer)
      - `current_word_count` (integer)
      - `cover_image_url` (text)
      - `status` (text)
      - `created_at`, `last_modified`, `synced_at` (timestamps)
      - `version` (integer)
    
    - `chapters` - Book chapters
      - `id` (text, primary key)
      - `project_id` (text, foreign key to projects)
      - `title` (text)
      - `content` (text)
      - `order` (integer)
      - `status` (text)
      - `word_count` (integer)
      - `notes` (text)
      - Timestamps and versioning

    - `research_items` - Research notes and references
    - `materials` - Reference materials and files
    - `citations` - Citation management
    - `writing_sessions` - Analytics tracking
    - `writing_goals` - Goal tracking
    - `daily_metrics` - Productivity metrics
    - `generated_images` - AI-generated images

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies check user_id or project ownership
    - Storage bucket for user files with RLS

  3. Performance
    - Indexes on foreign keys and frequently queried columns
    - Auto-update triggers for timestamps
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    visual_style TEXT,
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
    structure JSONB DEFAULT '[]',
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
    query TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT,
    source_url TEXT,
    confidence TEXT,
    verified BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    folder_id TEXT,
    linked_chapter_ids TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Plot Points Table
CREATE TABLE IF NOT EXISTS plot_points (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    chapter_id TEXT,
    act INTEGER,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Visuals Table
CREATE TABLE IF NOT EXISTS visuals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    diagram_code TEXT,
    svg_data TEXT,
    image_url TEXT,
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
    content TEXT,
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

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_modified ON projects(last_modified DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_project_id ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters("order");
CREATE INDEX IF NOT EXISTS idx_research_items_project_id ON research_items(project_id);
CREATE INDEX IF NOT EXISTS idx_plot_points_project_id ON plot_points(project_id);
CREATE INDEX IF NOT EXISTS idx_plot_points_order ON plot_points("order");
CREATE INDEX IF NOT EXISTS idx_visuals_project_id ON visuals(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_project_id ON writing_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_goals_project_id ON writing_goals(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE visuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

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

-- Plot Points Policies
CREATE POLICY "Users can view plot points of their projects" ON plot_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = plot_points.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create plot points in their projects" ON plot_points
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = plot_points.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update plot points of their projects" ON plot_points
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = plot_points.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete plot points of their projects" ON plot_points
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = plot_points.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Visuals Policies
CREATE POLICY "Users can view visuals of their projects" ON visuals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = visuals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create visuals in their projects" ON visuals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = visuals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update visuals of their projects" ON visuals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = visuals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete visuals of their projects" ON visuals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = visuals.project_id
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

-- Writing Sessions Policies
CREATE POLICY "Users can view sessions of their projects" ON writing_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sessions in their projects" ON writing_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Writing Goals Policies
CREATE POLICY "Users can view goals of their projects" ON writing_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_goals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create goals in their projects" ON writing_goals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_goals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update goals of their projects" ON writing_goals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_goals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete goals of their projects" ON writing_goals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = writing_goals.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Daily Metrics Policies
CREATE POLICY "Users can view their own metrics" ON daily_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" ON daily_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics" ON daily_metrics
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update last_modified timestamp
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

CREATE TRIGGER update_plot_points_updated_at BEFORE UPDATE ON plot_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visuals_updated_at BEFORE UPDATE ON visuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TASKFLOW - SCHEMA DO BANCO DE DADOS
-- ============================================================
-- Execute este código SQL no Editor SQL do seu Supabase
-- Acesse: https://supabase.com/dashboard > Seu Projeto > SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABELA DE PERFIS DE USUÁRIOS (profiles)
-- ============================================================
-- Esta tabela armazena informações adicionais dos usuários
-- O Supabase já cria automaticamente a tabela auth.users
-- Aqui guardamos dados extras como nome e avatar

CREATE TABLE IF NOT EXISTS profiles (
    -- ID do usuário (referência à tabela auth.users do Supabase)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Nome completo do usuário
    full_name TEXT,
    
    -- URL do avatar/foto de perfil
    avatar_url TEXT,
    
    -- Email do usuário (duplicado para facilitar consultas)
    email TEXT,
    
    -- Data de criação do perfil
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data da última atualização
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentário na tabela
COMMENT ON TABLE profiles IS 'Perfis dos usuários com informações adicionais';

-- ============================================================
-- 2. TABELA DE PROJETOS (projects)
-- ============================================================
-- Armazena os projetos criados pelos usuários

CREATE TABLE IF NOT EXISTS projects (
    -- ID único do projeto (gerado automaticamente)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Nome do projeto
    name TEXT NOT NULL,
    
    -- Descrição do projeto
    description TEXT,
    
    -- Cor do projeto para identificação visual (hex color)
    color TEXT DEFAULT '#6366f1',
    
    -- ID do usuário que criou o projeto (dono)
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status do projeto: 'active', 'archived', 'completed'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    
    -- Data de criação
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data da última atualização
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar projetos por dono
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- Comentário na tabela
COMMENT ON TABLE projects IS 'Projetos criados pelos usuários';

-- ============================================================
-- 3. TABELA DE MEMBROS DO PROJETO (project_members)
-- ============================================================
-- Relaciona usuários aos projetos (colaboradores)

CREATE TABLE IF NOT EXISTS project_members (
    -- ID único do registro
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ID do projeto
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- ID do usuário membro
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Papel do membro: 'owner', 'admin', 'member', 'viewer'
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    
    -- Data em que foi adicionado ao projeto
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garante que um usuário só pode ser membro uma vez por projeto
    UNIQUE(project_id, user_id)
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- Comentário na tabela
COMMENT ON TABLE project_members IS 'Membros e colaboradores de cada projeto';

-- ============================================================
-- 4. TABELA DE TAREFAS (tasks)
-- ============================================================
-- Armazena as tarefas de cada projeto

CREATE TABLE IF NOT EXISTS tasks (
    -- ID único da tarefa
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ID do projeto ao qual a tarefa pertence
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Título da tarefa
    title TEXT NOT NULL,
    
    -- Descrição detalhada da tarefa
    description TEXT,
    
    -- Status: 'todo', 'in_progress', 'review', 'done'
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    
    -- Prioridade: 'low', 'medium', 'high', 'urgent'
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- ID do usuário responsável pela tarefa (pode ser nulo)
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- ID do usuário que criou a tarefa
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Data de vencimento da tarefa
    due_date DATE,
    
    -- Posição para ordenação (drag and drop)
    position INTEGER DEFAULT 0,
    
    -- Data de criação
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data da última atualização
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Comentário na tabela
COMMENT ON TABLE tasks IS 'Tarefas dentro de cada projeto';

-- ============================================================
-- 5. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================================
-- Quando um novo usuário se registra, cria automaticamente seu perfil

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger se já existir e cria novamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. TRIGGER PARA ATUALIZAR updated_at
-- ============================================================
-- Atualiza automaticamente o campo updated_at quando um registro é modificado

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ============================================================
-- Habilita RLS nas tabelas para garantir que usuários só vejam seus próprios dados

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para PROJECTS
-- Usuários podem ver projetos que criaram ou são membros
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );

-- Usuários podem criar projetos
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Donos podem atualizar seus projetos
CREATE POLICY "Owners can update projects" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

-- Donos podem deletar seus projetos
CREATE POLICY "Owners can delete projects" ON projects
    FOR DELETE USING (owner_id = auth.uid());

-- Políticas para PROJECT_MEMBERS
-- Membros podem ver outros membros do mesmo projeto
CREATE POLICY "Members can view project members" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Donos do projeto podem adicionar membros
CREATE POLICY "Owners can add members" ON project_members
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- Donos podem remover membros
CREATE POLICY "Owners can remove members" ON project_members
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- Políticas para TASKS
-- Usuários podem ver tarefas dos projetos que participam
CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Usuários podem criar tarefas em projetos que participam
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Usuários podem atualizar tarefas em projetos que participam
CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Criadores da tarefa ou donos do projeto podem deletar
CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (
        created_by = auth.uid() OR
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
-- Após executar este script, seu banco de dados estará pronto!
-- Você pode verificar as tabelas em: Database > Tables
-- ============================================================

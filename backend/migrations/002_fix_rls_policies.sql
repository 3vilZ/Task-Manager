-- Script para resetear y configurar correctamente las políticas RLS
-- Ejecuta este script en el SQL Editor de Supabase si tienes problemas con RLS

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can insert their own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can update their own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can delete their own time blocks" ON time_blocks;

-- Asegurar que RLS está habilitado
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tasks
-- SELECT: usuarios solo ven sus propias tareas
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: usuarios solo pueden crear sus tareas (user_id se asigna automáticamente)
CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuarios solo pueden actualizar sus tareas
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: usuarios solo pueden eliminar sus tareas
CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para time_blocks
CREATE POLICY "Users can view their own time blocks"
    ON time_blocks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks"
    ON time_blocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks"
    ON time_blocks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks"
    ON time_blocks FOR DELETE
    USING (auth.uid() = user_id);


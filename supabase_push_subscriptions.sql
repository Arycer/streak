-- Crear tabla para almacenar push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propias subscriptions
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propias subscriptions
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propias subscriptions
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Crear función para limpiar subscriptions antiguas
CREATE OR REPLACE FUNCTION cleanup_old_push_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions 
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Crear tabla para programar notificaciones
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time 
  ON scheduled_notifications (scheduled_for, sent);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
  ON scheduled_notifications (user_id);

-- Habilitar RLS para scheduled_notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para scheduled_notifications
CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled notifications" ON scheduled_notifications
  FOR DELETE USING (auth.uid() = user_id);

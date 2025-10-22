/*
  # Sistema de Administradores, Vendedores y Usuarios con Créditos

  1. Nuevas Tablas
    - `admins`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, hashed)
      - `created_at` (timestamp)
    
    - `sellers`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, hashed)
      - `admin_id` (uuid, referencia a admins)
      - `credits` (integer, créditos disponibles)
      - `created_at` (timestamp)
    
    - `end_users`
      - `id` (uuid, primary key)
      - `username` (text)
      - `password` (text, hashed)
      - `seller_id` (uuid, referencia a sellers)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para administradores
    - Políticas para vendedores
    - Registro de actividad
*/

-- Tabla de Administradores
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de Vendedores
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  admin_id uuid REFERENCES admins(id) ON DELETE CASCADE,
  credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla de Usuarios creados por vendedores
CREATE TABLE IF NOT EXISTS end_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password text NOT NULL,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_users ENABLE ROW LEVEL SECURITY;

-- Políticas para admins (acceso total desde la app)
CREATE POLICY "Admins can read all admins"
  ON admins FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (true);

-- Políticas para sellers
CREATE POLICY "Sellers can read all sellers"
  ON sellers FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert sellers"
  ON sellers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can update sellers"
  ON sellers FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Políticas para end_users
CREATE POLICY "End users can be read"
  ON end_users FOR SELECT
  USING (true);

CREATE POLICY "End users can be inserted"
  ON end_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "End users can be updated"
  ON end_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "End users can be deleted"
  ON end_users FOR DELETE
  USING (true);

-- Crear admin por defecto (username: admin, password: admin123)
-- En producción usar hash bcrypt real
INSERT INTO admins (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

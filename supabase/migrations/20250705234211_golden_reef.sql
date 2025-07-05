/*
  # Create trolls table

  1. New Tables
    - `trolls`
      - `id` (uuid, primary key)
      - `nick` (text, required)
      - `steam_id` (text, required)
      - `steam_id64` (text, optional)
      - `reason` (text, optional)
      - `faceit_url` (text, optional)
      - `date_added` (timestamp)
      - `last_modified` (timestamp)

  2. Security
    - Enable RLS on `trolls` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert/update/delete data
*/

CREATE TABLE IF NOT EXISTS trolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nick text NOT NULL,
  steam_id text NOT NULL,
  steam_id64 text DEFAULT 'No resuelto',
  reason text DEFAULT 'Sin razón especificada',
  faceit_url text DEFAULT '',
  date_added timestamptz DEFAULT now(),
  last_modified timestamptz DEFAULT now()
);

ALTER TABLE trolls ENABLE ROW LEVEL SECURITY;

-- Policy para permitir lectura a todos (ya que es una lista pública de trolls)
CREATE POLICY "Anyone can read trolls"
  ON trolls
  FOR SELECT
  TO public
  USING (true);

-- Policy para permitir inserción, actualización y eliminación a usuarios autenticados
CREATE POLICY "Authenticated users can manage trolls"
  ON trolls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_trolls_nick ON trolls(nick);
CREATE INDEX IF NOT EXISTS idx_trolls_steam_id ON trolls(steam_id);
CREATE INDEX IF NOT EXISTS idx_trolls_date_added ON trolls(date_added DESC);
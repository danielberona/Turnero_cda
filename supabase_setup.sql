-- ============================================================
-- CDA TURNERO — Script de configuración completa Supabase
-- Ejecutar en el SQL Editor de Supabase (en orden)
-- ============================================================


-- ============================================================
-- 1. EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  cedula          text NOT NULL,
  placa_vehiculo  text NOT NULL,
  fecha_registro  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turnos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          varchar(1) NOT NULL CHECK (codigo IN ('A', 'R', 'B', 'V')),
  numero          integer NOT NULL,
  categoria       text NOT NULL,
  color           text NOT NULL,
  placa_vehiculo  text NOT NULL,
  nombre_cliente  text NOT NULL,
  cedula_cliente  text NOT NULL,
  estado          text NOT NULL DEFAULT 'esperando'
                  CHECK (estado IN ('esperando', 'llamado', 'atendido')),
  creado_en       timestamptz DEFAULT now(),
  llamado_en      timestamptz
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_turnos_codigo_estado
  ON turnos (codigo, estado);

CREATE INDEX IF NOT EXISTS idx_turnos_creado_en
  ON turnos (creado_en);

CREATE INDEX IF NOT EXISTS idx_clientes_cedula
  ON clientes (cedula);


-- ============================================================
-- 3. FUNCIONES SQL
-- ============================================================

-- 3.1 generar_numero_turno
-- Devuelve el siguiente número secuencial del día para un código.
CREATE OR REPLACE FUNCTION generar_numero_turno(p_codigo varchar)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_ultimo integer;
BEGIN
  SELECT COALESCE(MAX(numero), 0)
    INTO v_ultimo
    FROM turnos
   WHERE codigo = p_codigo
     AND creado_en >= date_trunc('day', now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota';

  RETURN v_ultimo + 1;
END;
$$;


-- 3.2 llamar_siguiente_turno
-- Llama el turno más antiguo 'esperando' de la categoría indicada.
-- Si ya hay uno 'llamado' de esa categoría, lo marca 'atendido' primero.
CREATE OR REPLACE FUNCTION llamar_siguiente_turno(p_codigo varchar)
RETURNS SETOF turnos
LANGUAGE plpgsql
AS $$
DECLARE
  v_llamado_id  uuid;
  v_siguiente   turnos%ROWTYPE;
BEGIN
  -- Marcar 'atendido' el turno actualmente 'llamado' de este código
  SELECT id INTO v_llamado_id
    FROM turnos
   WHERE codigo = p_codigo
     AND estado = 'llamado'
   LIMIT 1;

  IF v_llamado_id IS NOT NULL THEN
    UPDATE turnos
       SET estado = 'atendido'
     WHERE id = v_llamado_id;
  END IF;

  -- Obtener el siguiente en espera (el más antiguo)
  SELECT * INTO v_siguiente
    FROM turnos
   WHERE codigo = p_codigo
     AND estado = 'esperando'
   ORDER BY creado_en ASC
   LIMIT 1;

  IF v_siguiente.id IS NULL THEN
    RAISE EXCEPTION 'No hay turnos en espera para la categoría %', p_codigo;
  END IF;

  -- Llamar el turno
  UPDATE turnos
     SET estado     = 'llamado',
         llamado_en = now()
   WHERE id = v_siguiente.id;

  RETURN QUERY
    SELECT * FROM turnos WHERE id = v_siguiente.id;
END;
$$;


-- 3.3 marcar_atendido
CREATE OR REPLACE FUNCTION marcar_atendido(p_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE turnos
     SET estado = 'atendido'
   WHERE id = p_id
     AND estado != 'atendido';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno % no encontrado o ya está atendido', p_id;
  END IF;
END;
$$;


-- 3.4 get_cola_por_categoria
-- Retorna para cada código: cantidad en espera y el turno actualmente llamado.
CREATE OR REPLACE FUNCTION get_cola_por_categoria()
RETURNS TABLE (
  codigo          varchar,
  categoria       text,
  color           text,
  en_espera       bigint,
  turno_llamado   json
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH categorias AS (
    -- Datos fijos de referencia
    SELECT 'A'::varchar AS codigo, 'Revisión Técnico-Mecánica'  AS categoria, '#2196F3' AS color
    UNION ALL
    SELECT 'R', 'Reinspección', '#FF9800'
    UNION ALL
    SELECT 'B', 'SOAT / Documentos', '#4CAF50'
    UNION ALL
    SELECT 'V', 'VIP / Preferencial', '#9C27B0'
  ),
  espera AS (
    SELECT t.codigo, COUNT(*) AS total
      FROM turnos t
     WHERE t.estado = 'esperando'
     GROUP BY t.codigo
  ),
  llamados AS (
    SELECT DISTINCT ON (t.codigo)
           t.codigo,
           row_to_json(t) AS turno_json
      FROM turnos t
     WHERE t.estado = 'llamado'
     ORDER BY t.codigo, t.llamado_en DESC
  )
  SELECT
    c.codigo,
    c.categoria,
    c.color,
    COALESCE(e.total, 0)  AS en_espera,
    l.turno_json          AS turno_llamado
  FROM categorias c
  LEFT JOIN espera  e ON e.codigo = c.codigo
  LEFT JOIN llamados l ON l.codigo = c.codigo
  ORDER BY c.codigo;
END;
$$;


-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE turnos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Eliminar policies previas si existen (permite re-ejecutar sin errores)
DROP POLICY IF EXISTS "turnos_lectura_publica"       ON turnos;
DROP POLICY IF EXISTS "turnos_insertar_autenticado"  ON turnos;
DROP POLICY IF EXISTS "turnos_actualizar_autenticado" ON turnos;
DROP POLICY IF EXISTS "clientes_lectura_autenticada"  ON clientes;
DROP POLICY IF EXISTS "clientes_insertar_autenticado" ON clientes;

-- turnos: lectura pública (pantalla TV sin autenticación)
CREATE POLICY "turnos_lectura_publica"
  ON turnos FOR SELECT
  USING (true);

-- turnos: inserción solo autenticada (operario)
CREATE POLICY "turnos_insertar_autenticado"
  ON turnos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- turnos: actualización solo autenticada
CREATE POLICY "turnos_actualizar_autenticado"
  ON turnos FOR UPDATE
  TO authenticated
  USING (true);

-- clientes: lectura solo autenticada
CREATE POLICY "clientes_lectura_autenticada"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

-- clientes: inserción solo autenticada
CREATE POLICY "clientes_insertar_autenticado"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir ejecución de funciones desde el rol anon (pantalla TV)
-- Las funciones de lectura no mutan datos sensibles
GRANT EXECUTE ON FUNCTION get_cola_por_categoria() TO anon;
GRANT EXECUTE ON FUNCTION get_cola_por_categoria() TO authenticated;
GRANT EXECUTE ON FUNCTION generar_numero_turno(varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION llamar_siguiente_turno(varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION marcar_atendido(uuid) TO authenticated;


-- ============================================================
-- 5. REALTIME
-- Habilitar publicación de cambios en la tabla turnos.
-- En Supabase Dashboard también activar "Realtime" en la tabla.
-- ============================================================

-- Agregar turnos a Realtime solo si no está ya incluida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND tablename = 'turnos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
  END IF;
END;
$$;


-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

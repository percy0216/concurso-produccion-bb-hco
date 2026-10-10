-- =========================================================
-- FIX: Auto-cálculo de cumple_meta en la BD
-- Generated column: se calcula automáticamente al insertar/actualizar
-- 1 = Sí cumple (≤480 seg = 8 min), 0 = No cumple (>480 seg), NULL = incompleta
-- =========================================================

-- 1. Eliminar columna actual (si existe) y recrear como generated
ALTER TABLE public.comandas 
DROP COLUMN IF EXISTS cumple_meta;

ALTER TABLE public.comandas 
ADD COLUMN cumple_meta SMALLINT 
GENERATED ALWAYS AS (
  CASE
    WHEN hora_entrega_cliente IS NULL OR hora_emision_caja IS NULL THEN NULL
    WHEN EXTRACT(EPOCH FROM (hora_entrega_cliente - hora_emision_caja)) <= 480 THEN 1
    ELSE 0
  END
) STORED;

-- 2. Índice para consultas rápidas por meta
CREATE INDEX IF NOT EXISTS idx_comandas_cumple_meta ON public.comandas(cumple_meta);

-- 3. Comentario para documentación
COMMENT ON COLUMN public.comandas.cumple_meta IS 
'1 = Cumple meta (≤8 min = 480 seg), 0 = No cumple (>8 min), NULL = incompleta (falta hora_emision_caja o hora_entrega_cliente). Calculado automáticamente.';

-- 4. Verificar que funciona
-- INSERT de prueba (ejecutar después de aplicar):
-- INSERT INTO public.comandas (id_orden, fase, grupo, turno, hora_emision_caja, hora_entrega_cliente, user_id)
-- VALUES ('TEST-001', 'pretest', 'GU', 1, NOW(), NOW() + INTERVAL '5 minutes', auth.uid());
-- SELECT id_orden, EXTRACT(EPOCH FROM (hora_entrega_cliente - hora_emision_caja)) as segundos, cumple_meta FROM public.comandas WHERE id_orden = 'TEST-001';
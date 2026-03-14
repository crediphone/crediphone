-- FASE 28 FIX: Actualizar trigger crear_alerta_producto_nuevo para incluir distribuidor_id
-- El trigger se ejecuta al insertar en verificaciones_items cuando es_producto_nuevo = true
-- Ahora verificaciones_items ya tiene distribuidor_id (se inserta desde scanProducto)
-- El trigger lo lee de NEW.distribuidor_id o hace fallback al JOIN con verificaciones_inventario

DROP FUNCTION IF EXISTS crear_alerta_producto_nuevo() CASCADE;

CREATE OR REPLACE FUNCTION crear_alerta_producto_nuevo()
RETURNS TRIGGER AS $$
DECLARE
  usuario_scanner UUID;
  dist_id UUID;
BEGIN
  -- Only create alert if it's a new product
  IF NEW.es_producto_nuevo = true THEN
    -- Get user and distribuidor_id from verification session
    SELECT usuario_id, distribuidor_id
    INTO usuario_scanner, dist_id
    FROM verificaciones_inventario
    WHERE id = NEW.verificacion_id;

    -- Fallback: if verificaciones_items already has distribuidor_id use it
    IF NEW.distribuidor_id IS NOT NULL THEN
      dist_id := NEW.distribuidor_id;
    END IF;

    -- Create alert (only if we have a valid distribuidor_id)
    IF dist_id IS NOT NULL THEN
      INSERT INTO alertas_productos_nuevos (
        verificacion_id,
        verificacion_item_id,
        codigo_escaneado,
        escaneado_por,
        distribuidor_id,
        estado
      ) VALUES (
        NEW.verificacion_id,
        NEW.id,
        NEW.codigo_escaneado,
        usuario_scanner,
        dist_id,
        'pendiente'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger (fue eliminado por el DROP CASCADE anterior)
CREATE TRIGGER trigger_crear_alerta_producto_nuevo
AFTER INSERT ON verificaciones_items
FOR EACH ROW
WHEN (NEW.es_producto_nuevo = true)
EXECUTE FUNCTION crear_alerta_producto_nuevo();

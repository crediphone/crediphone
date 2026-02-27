-- Función simplificada para calcular puntaje de documentación
CREATE OR REPLACE FUNCTION calcular_puntaje_documentacion(cliente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  docs_completos INT := 0;
  puntaje INT := 0;
BEGIN
  -- Por ahora retornar un puntaje base de 5 puntos
  -- Se puede mejorar cuando se tengan todos los campos correctos
  puntaje := 5;
  
  -- Intentar contar documentos básicos que sabemos que existen
  SELECT
    (CASE WHEN curp IS NOT NULL AND curp != '' THEN 2 ELSE 0 END) +
    (CASE WHEN ine IS NOT NULL AND ine != '' THEN 2 ELSE 0 END) +
    (CASE WHEN direccion IS NOT NULL AND direccion != '' THEN 1 ELSE 0 END)
  INTO docs_completos
  FROM public.clientes
  WHERE id = cliente_uuid;

  puntaje := LEAST(10, docs_completos);

  RETURN puntaje;
END;
$$ LANGUAGE plpgsql;

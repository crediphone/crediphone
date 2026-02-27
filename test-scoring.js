// Script de prueba para verificar el sistema de scoring
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Usar SERVICE_ROLE_KEY para bypassear RLS
);

async function testScoring() {
  console.log('🔍 Probando conexión a Supabase...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // 1. Obtener un cliente de prueba
    console.log('\n📋 Obteniendo clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nombre, apellido')
      .limit(1);

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.log('⚠️  No hay clientes en la base de datos');
      return;
    }

    const cliente = clientes[0];
    console.log(`✅ Cliente encontrado: ${cliente.nombre} ${cliente.apellido} (${cliente.id})`);

    // 2. Probar la función RPC
    console.log('\n🧮 Probando función calcular_scoring_cliente...');
    const { data: scoringData, error: rpcError } = await supabase
      .rpc('calcular_scoring_cliente', { cliente_uuid: cliente.id });

    if (rpcError) {
      console.error('❌ Error RPC:', rpcError);
      console.error('Detalles:', JSON.stringify(rpcError, null, 2));
      return;
    }

    console.log('✅ Función RPC ejecutada exitosamente');
    console.log('📊 Resultado:', JSON.stringify(scoringData, null, 2));

    // 3. Intentar insertar en la tabla
    if (scoringData && scoringData.length > 0) {
      const resultado = scoringData[0];
      console.log('\n💾 Intentando guardar en scoring_clientes...');

      const { data: insertData, error: insertError } = await supabase
        .from('scoring_clientes')
        .upsert({
          cliente_id: cliente.id,
          puntaje_total: resultado.puntaje_total || 0,
          puntaje_historial_pagos: resultado.puntaje_historial || 0,
          puntaje_antiguedad: resultado.puntaje_antiguedad || 0,
          puntaje_referencias: resultado.puntaje_referencias || 0,
          puntaje_capacidad_pago: resultado.puntaje_capacidad || 0,
          puntaje_documentacion: resultado.puntaje_documentacion || 0,
          nivel_riesgo: resultado.nivel_riesgo || 'SIN_EVALUAR',
          limite_credito_sugerido: resultado.limite_sugerido || 0,
          enganche_minimo_sugerido: resultado.enganche_sugerido || 20,
          tasa_interes_sugerida: resultado.tasa_sugerida || 25.00,
          plazo_maximo_sugerido: resultado.plazo_sugerido || 12,
        })
        .select();

      if (insertError) {
        console.error('❌ Error al insertar:', insertError);
        console.error('Detalles:', JSON.stringify(insertError, null, 2));
        return;
      }

      console.log('✅ Scoring guardado exitosamente');
      console.log('💾 Datos guardados:', JSON.stringify(insertData, null, 2));
    }

    console.log('\n✅ ¡Prueba completada exitosamente!');
  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
    console.error('Stack:', error.stack);
  }
}

testScoring();

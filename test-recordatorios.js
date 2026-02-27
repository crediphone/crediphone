// Script para verificar estado de créditos y recordatorios
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarRecordatorios() {
  console.log("🔍 Verificando estado de créditos para recordatorios...\n");

  // 1. Verificar si existe la tabla de notificaciones
  const { data: tablas, error: errorTablas } = await supabase
    .from("notificaciones")
    .select("id")
    .limit(1);

  if (errorTablas) {
    console.log("❌ ERROR: La tabla 'notificaciones' no existe");
    console.log("📝 Debes ejecutar el SQL en Supabase:");
    console.log("   1. Ve a Supabase Dashboard > SQL Editor");
    console.log("   2. Copia el contenido de supabase/fase6-notificaciones.sql");
    console.log("   3. Ejecuta el script\n");
    return;
  }

  console.log("✅ Tabla 'notificaciones' existe\n");

  // 2. Obtener todos los créditos activos
  const { data: creditos, error } = await supabase
    .from("creditos")
    .select(
      `
      id,
      folio,
      monto,
      fecha_fin,
      dias_mora,
      monto_mora,
      estado,
      cliente_id,
      clientes!inner(nombre, apellido, telefono)
    `
    )
    .eq("estado", "activo")
    .order("fecha_fin", { ascending: true });

  if (error) {
    console.log("❌ Error al obtener créditos:", error.message);
    return;
  }

  if (!creditos || creditos.length === 0) {
    console.log("⚠️  NO TIENES CRÉDITOS ACTIVOS");
    console.log("📝 Para probar el sistema de recordatorios necesitas:");
    console.log("   1. Crear al menos un cliente");
    console.log("   2. Crear al menos un crédito activo");
    console.log("   3. El crédito debe estar próximo a vencer o tener mora\n");
    return;
  }

  console.log(`📊 CRÉDITOS ACTIVOS ENCONTRADOS: ${creditos.length}\n`);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let conMora = 0;
  let proximosVencer = 0;
  let sinAlertas = 0;

  creditos.forEach((credito) => {
    const clienteData = Array.isArray(credito.clientes)
      ? credito.clientes[0]
      : credito.clientes;
    const fechaFin = new Date(credito.fecha_fin);
    fechaFin.setHours(0, 0, 0, 0);

    const diasHastaVencimiento = Math.floor(
      (fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    const diasMora = credito.dias_mora || 0;

    let categoria = "";
    let prioridad = "";

    if (diasMora > 0) {
      conMora++;
      categoria = "CON MORA";
      prioridad = diasMora > 30 ? "🚨 URGENTE" : diasMora > 7 ? "⚠️  ALTA" : "⏰ MEDIA";
    } else if (diasHastaVencimiento >= 0 && diasHastaVencimiento <= 7) {
      proximosVencer++;
      categoria = "PRÓXIMO A VENCER";
      prioridad =
        diasHastaVencimiento <= 1
          ? "⚠️  ALTA"
          : diasHastaVencimiento <= 3
            ? "⏰ MEDIA"
            : "📋 BAJA";
    } else {
      sinAlertas++;
      categoria = "SIN ALERTA";
      prioridad = "-";
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Folio: ${credito.folio || credito.id.slice(0, 8)}`);
    console.log(`Cliente: ${clienteData.nombre} ${clienteData.apellido}`);
    console.log(`Monto: $${Number(credito.monto).toLocaleString("es-MX")}`);
    console.log(`Fecha vencimiento: ${credito.fecha_fin}`);
    console.log(`Días hasta vencimiento: ${diasHastaVencimiento}`);
    console.log(`Días de mora: ${diasMora}`);
    console.log(`Categoría: ${categoria}`);
    console.log(`Prioridad: ${prioridad}`);
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📈 RESUMEN:");
  console.log(`   Créditos con mora: ${conMora}`);
  console.log(`   Próximos a vencer (≤7 días): ${proximosVencer}`);
  console.log(`   Sin alertas: ${sinAlertas}`);
  console.log(`   TOTAL que aparecen en recordatorios: ${conMora + proximosVencer}`);

  if (conMora + proximosVencer === 0) {
    console.log("\n⚠️  NINGÚN CRÉDITO APARECERÁ EN RECORDATORIOS");
    console.log("📝 Para que aparezcan recordatorios, necesitas créditos que:");
    console.log("   • Tengan mora (dias_mora > 0) O");
    console.log("   • Venzan en los próximos 7 días");
    console.log("\n💡 OPCIONES:");
    console.log("   1. Editar un crédito existente para que venza pronto");
    console.log("   2. Crear un crédito nuevo con fecha_fin cercana");
    console.log("   3. Ejecutar el cron job de actualización de mora");
  } else {
    console.log("\n✅ Estos créditos SÍ aparecerán en /dashboard/recordatorios");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

verificarRecordatorios()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

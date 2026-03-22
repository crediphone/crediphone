/**
 * FASE 56: Definición de permisos granulares del sistema.
 *
 * Cada permiso es una acción específica que puede concederse o denegarse
 * a un empleado individual, independientemente de su rol.
 *
 * Convención: <modulo>_<accion>
 */

// ─── Catálogo de permisos ─────────────────────────────────────────────────────

export type Permiso =
  // Productos
  | "producto_crear"
  | "producto_editar"
  | "producto_eliminar"
  | "producto_precio_editar"
  | "producto_importar"
  // Inventario
  | "inventario_verificar"
  | "inventario_ubicaciones"
  | "inventario_alertas"
  | "inventario_series"
  // Créditos
  | "credito_crear"
  | "credito_editar"
  | "credito_cancelar"
  | "credito_cartera_vencida"
  // Pagos
  | "pago_registrar"
  | "pago_eliminar"
  // POS
  | "pos_ventas"
  | "pos_caja"
  | "pos_descuento_autorizar"
  | "pos_devolucion"
  // Reportes
  | "reporte_ver"
  | "reporte_exportar"
  | "reporte_comisiones"
  // Empleados
  | "empleado_ver"
  | "empleado_crear"
  | "empleado_editar"
  // Reparaciones
  | "reparacion_ver"
  | "reparacion_crear"
  | "reparacion_editar"
  | "reparacion_eliminar"
  // Servicios
  | "servicio_crear"
  | "servicio_editar"
  // Compras
  | "compra_crear"
  | "compra_aprobar"
  // Asistencia
  | "asistencia_ver_todos";

// ─── Grupos visuales para la UI ───────────────────────────────────────────────

export interface GrupoPermiso {
  id: string;
  label: string;
  icono: string;
  permisos: { key: Permiso; label: string; desc: string }[];
}

export const GRUPOS_PERMISOS: GrupoPermiso[] = [
  {
    id: "productos",
    label: "Catálogo de Productos",
    icono: "Package",
    permisos: [
      { key: "producto_crear",        label: "Crear productos",      desc: "Agregar nuevos productos al catálogo" },
      { key: "producto_editar",       label: "Editar productos",     desc: "Modificar datos, stock y descripción" },
      { key: "producto_eliminar",     label: "Eliminar productos",   desc: "Borrar productos del catálogo" },
      { key: "producto_precio_editar",label: "Cambiar precios",      desc: "Editar precio de venta y costo" },
      { key: "producto_importar",     label: "Importar Excel",       desc: "Cargar productos masivamente por archivo" },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icono: "Warehouse",
    permisos: [
      { key: "inventario_verificar",   label: "Verificar inventario", desc: "Hacer conteos y verificaciones físicas" },
      { key: "inventario_ubicaciones", label: "Gestionar ubicaciones",desc: "Crear y editar ubicaciones de almacén" },
      { key: "inventario_alertas",     label: "Ver alertas de stock", desc: "Acceder al panel de stock bajo" },
      { key: "inventario_series",      label: "Ver series/IMEIs",     desc: "Ver y gestionar números de serie por lote" },
    ],
  },
  {
    id: "creditos",
    label: "Créditos",
    icono: "CreditCard",
    permisos: [
      { key: "credito_crear",          label: "Crear créditos",       desc: "Registrar nuevos créditos a clientes" },
      { key: "credito_editar",         label: "Editar créditos",      desc: "Modificar plazos, enganches, datos" },
      { key: "credito_cancelar",       label: "Cancelar créditos",    desc: "Marcar créditos como cancelados" },
      { key: "credito_cartera_vencida",label: "Cartera vencida",      desc: "Ver y gestionar créditos vencidos" },
    ],
  },
  {
    id: "pagos",
    label: "Cobros y Pagos",
    icono: "Wallet",
    permisos: [
      { key: "pago_registrar",  label: "Registrar pagos",  desc: "Abonar pagos a créditos existentes" },
      { key: "pago_eliminar",   label: "Eliminar pagos",   desc: "Borrar registros de pago" },
    ],
  },
  {
    id: "pos",
    label: "Punto de Venta",
    icono: "Store",
    permisos: [
      { key: "pos_ventas",             label: "Ventas POS",           desc: "Realizar ventas de contado" },
      { key: "pos_caja",               label: "Apertura/cierre caja", desc: "Abrir y cerrar turno de caja" },
      { key: "pos_descuento_autorizar",label: "Autorizar descuentos", desc: "Aprobar descuentos que superan el límite" },
      { key: "pos_devolucion",         label: "Devoluciones",         desc: "Procesar devoluciones de ventas" },
    ],
  },
  {
    id: "reportes",
    label: "Reportes",
    icono: "BarChart2",
    permisos: [
      { key: "reporte_ver",       label: "Ver reportes",       desc: "Acceder a la sección de reportes" },
      { key: "reporte_exportar",  label: "Exportar reportes",  desc: "Descargar CSV/PDF de reportes" },
      { key: "reporte_comisiones",label: "Ver comisiones",     desc: "Ver el detalle de comisiones por vendedor" },
    ],
  },
  {
    id: "reparaciones",
    label: "Reparaciones",
    icono: "Wrench",
    permisos: [
      { key: "reparacion_ver",     label: "Ver reparaciones",    desc: "Consultar órdenes de reparación" },
      { key: "reparacion_crear",   label: "Crear reparaciones",  desc: "Abrir nuevas órdenes" },
      { key: "reparacion_editar",  label: "Editar reparaciones", desc: "Actualizar estado, piezas, diagnóstico" },
      { key: "reparacion_eliminar",label: "Eliminar reparaciones",desc: "Borrar órdenes de reparación" },
    ],
  },
  {
    id: "servicios",
    label: "Servicios sin Inventario",
    icono: "ShoppingBag",
    permisos: [
      { key: "servicio_crear",  label: "Crear servicios",  desc: "Agregar nuevos servicios al catálogo" },
      { key: "servicio_editar", label: "Editar servicios", desc: "Modificar nombre, precio y categoría" },
    ],
  },
  {
    id: "compras",
    label: "Órdenes de Compra",
    icono: "ShoppingCart",
    permisos: [
      { key: "compra_crear",   label: "Crear órdenes",   desc: "Generar órdenes de compra a proveedores" },
      { key: "compra_aprobar", label: "Aprobar órdenes", desc: "Aprobar o rechazar órdenes de compra" },
    ],
  },
  {
    id: "empleados",
    label: "Empleados",
    icono: "Users",
    permisos: [
      { key: "empleado_ver",    label: "Ver empleados",    desc: "Consultar la lista de empleados" },
      { key: "empleado_crear",  label: "Crear empleados",  desc: "Agregar nuevos empleados al sistema" },
      { key: "empleado_editar", label: "Editar empleados", desc: "Modificar datos y rol de empleados" },
    ],
  },
  {
    id: "asistencia",
    label: "Asistencia",
    icono: "Clock",
    permisos: [
      { key: "asistencia_ver_todos", label: "Ver todos", desc: "Ver asistencia de todos los empleados (no solo la propia)" },
    ],
  },
];

// ─── Permisos por defecto según rol ──────────────────────────────────────────
// Define qué puede hacer cada rol SIN necesitar permisos explícitos.
// Los permisos granulares AMPLÍAN o RESTRINGEN esto por empleado.

export const PERMISOS_ROL: Record<string, Permiso[]> = {
  super_admin: [], // super_admin tiene TODO implícitamente (se evalúa antes)

  admin: [
    "producto_crear","producto_editar","producto_eliminar","producto_precio_editar","producto_importar",
    "inventario_verificar","inventario_ubicaciones","inventario_alertas","inventario_series",
    "credito_crear","credito_editar","credito_cancelar","credito_cartera_vencida",
    "pago_registrar","pago_eliminar",
    "pos_ventas","pos_caja","pos_descuento_autorizar","pos_devolucion",
    "reporte_ver","reporte_exportar","reporte_comisiones",
    "reparacion_ver","reparacion_crear","reparacion_editar","reparacion_eliminar",
    "servicio_crear","servicio_editar",
    "compra_crear","compra_aprobar",
    "empleado_ver","empleado_crear","empleado_editar",
    "asistencia_ver_todos",
  ],

  vendedor: [
    "producto_editar",                        // puede editar pero no crear/eliminar por defecto
    "inventario_verificar","inventario_ubicaciones",
    "credito_crear",
    "pos_ventas","pos_caja","pos_devolucion",
    "reparacion_ver",
  ],

  cobrador: [
    "credito_cartera_vencida",
    "pago_registrar",
    "reporte_ver",
  ],

  tecnico: [
    "reparacion_ver","reparacion_editar",
  ],
};

// ─── Helper: verificar permiso ────────────────────────────────────────────────

/**
 * Verifica si un usuario tiene un permiso dado.
 *
 * Lógica:
 * 1. super_admin → siempre true
 * 2. Si existe un registro en permisos_empleado para (userId, permiso):
 *    → usa ese valor (activo = true/false) — override explícito
 * 3. Si no hay registro explícito → usa los permisos por defecto del rol
 */
export function tienePermiso(
  role: string | null,
  permisosExplicitos: Record<string, boolean>, // { [permiso]: activo }
  permiso: Permiso
): boolean {
  if (role === "super_admin") return true;

  // Override explícito del admin
  if (permiso in permisosExplicitos) {
    return permisosExplicitos[permiso] === true;
  }

  // Default del rol
  const defaults = PERMISOS_ROL[role ?? ""] ?? [];
  return defaults.includes(permiso);
}

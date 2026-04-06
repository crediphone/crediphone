# Roles y Permisos — CREDIPHONE
> Leer si tocas auth, permisos, sidebar o páginas de acceso restringido.

---

## Resumen de roles

| Rol | Propósito | distribuidorId en BD |
|---|---|---|
| `super_admin` | Dueño/operador de la red completa | NULL → ve TODOS los distribuidores |
| `admin` | Gerente de una tienda | su distribuidor |
| `vendedor` | Vendedor de la tienda | su distribuidor |
| `cobrador` | Especialista en cobranza | su distribuidor |
| `tecnico` | Técnico de reparaciones | su distribuidor |

---

## super_admin

**Acceso:** Todo el sistema sin excepción.
**Técnico:** `distribuidor_id = NULL` en tabla `users`. Las queries sin `filterDistribuidorId` devuelven datos de TODOS los distribuidores.

Páginas exclusivas: `/dashboard/admin/distribuidores`

---

## admin

Páginas accesibles:
```
/dashboard, /dashboard/clientes, /dashboard/creditos, /dashboard/creditos/cartera-vencida,
/dashboard/creditos/[id], /dashboard/pagos, /dashboard/productos,
/dashboard/admin/categorias, /dashboard/admin/proveedores,
/dashboard/pos, /dashboard/pos/caja, /dashboard/pos/historial,
/dashboard/inventario/verificar, /dashboard/inventario/ubicaciones, /dashboard/inventario/alertas,
/dashboard/empleados, /dashboard/reparaciones, /dashboard/reparaciones/[id],
/dashboard/dashboard-reparaciones, /dashboard/reportes, /dashboard/reportes/comisiones,
/dashboard/recordatorios, /dashboard/configuracion
```

---

## vendedor

Páginas accesibles:
```
/dashboard, /dashboard/clientes, /dashboard/creditos, /dashboard/pagos,
/dashboard/productos, /dashboard/pos, /dashboard/pos/caja, /dashboard/pos/historial,
/dashboard/inventario/verificar, /dashboard/inventario/ubicaciones, /dashboard/recordatorios
```

**NO puede:** crear/editar empleados, ver reportes de comisiones, configurar el sistema, ver cartera vencida.
**Reparaciones:** Solo si el admin habilita el módulo `reparaciones` en configuración.

---

## cobrador

Páginas accesibles:
```
/dashboard, /dashboard/clientes, /dashboard/creditos, /dashboard/creditos/cartera-vencida,
/dashboard/pagos, /dashboard/pos/historial, /dashboard/recordatorios
```

**NO puede:** crear créditos, usar POS/Caja, gestionar productos/inventario, ver reparaciones.

---

## tecnico

Páginas accesibles:
```
/dashboard, /dashboard/reparaciones, /dashboard/reparaciones/[id],
/dashboard/dashboard-reparaciones, /dashboard/tecnico
```

**NO puede:** ver clientes, créditos, pagos, usar POS, gestionar empleados, ver reportes.

---

## Reglas de permisos en APIs

```
GET  /api/productos      → autenticado (filtra por distribuidor automático)
POST /api/productos      → admin, super_admin
GET  /api/clientes       → admin, vendedor, cobrador, super_admin
POST /api/clientes       → admin, vendedor, super_admin
GET  /api/creditos       → admin, vendedor, cobrador, super_admin
POST /api/creditos       → admin, vendedor, super_admin
GET  /api/pagos          → admin, vendedor, cobrador, super_admin
POST /api/pagos          → admin, cobrador, super_admin
GET  /api/empleados      → admin, super_admin
POST /api/empleados      → admin, super_admin
GET  /api/reparaciones   → admin, tecnico, super_admin
POST /api/reparaciones   → admin, super_admin
GET  /api/stats          → autenticado
GET  /api/configuracion  → autenticado
PUT  /api/configuracion  → admin, super_admin
GET/POST /api/admin/distribuidores       → super_admin SOLO
PATCH/GET /api/admin/distribuidores/[id] → super_admin SOLO
```

---

## Patrón de guard en páginas frontend

```typescript
// Al inicio de cada página con rol restringido:
const { user } = useAuth();
const router = useRouter();

useEffect(() => {
  if (user && user.role !== "admin" && user.role !== "super_admin") {
    router.push("/dashboard");
  }
}, [user, router]);
```

Ver `src/app/dashboard/empleados/page.tsx` como ejemplo de referencia.

# 📚 SECCIONES COMPLEMENTARIAS - DOCUMENTO MAESTRO CREDIPHONE
## Para agregar al documento principal

---

# SECCIÓN A: VISIÓN GENERAL INTEGRADA DEL SISTEMA

## Diagrama de Integración Total

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  CREDIPHONE ERP - VISIÓN COMPLETA                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ENTRADA DE CLIENTES                                                    │
│  ┌──────────────┐                                                       │
│  │   CLIENTE    │                                                       │
│  │  (Necesita)  │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                               │
│         ├──────────┬──────────────┬──────────────┐                     │
│         │          │              │              │                     │
│         ▼          ▼              ▼              ▼                     │
│   ┌─────────┐ ┌────────┐   ┌─────────┐   ┌──────────┐                │
│   │REPARAR  │ │COMPRAR │   │CRÉDITO  │   │RECARGA   │                │
│   │CELULAR  │ │ACCESORIO│   │PAYJOY   │   │SALDO     │                │
│   └────┬────┘ └───┬────┘   └────┬────┘   └─────┬────┘                │
│        │          │              │              │                     │
│  ┌─────┴──────────┴──────────────┴──────────────┴─────┐              │
│  │          SISTEMA CENTRAL - NEXT.JS 14               │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO RECEPCIÓN                            │   │              │
│  │  │  ├─ Verificación IMEI (IFT)                  │   │              │
│  │  │  ├─ Checklist 15 puntos                      │   │              │
│  │  │  ├─ Firma digital                            │   │              │
│  │  │  ├─ Generación QR                            │   │              │
│  │  │  └─ Anticipo (pasivo)                        │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  │          ↓                                           │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO DIAGNÓSTICO (Técnico)                │   │              │
│  │  │  ├─ Revisar equipo                           │   │              │
│  │  │  ├─ Detectar fallas                          │   │              │
│  │  │  ├─ Cotizar (IVA incluido)                   │   │              │
│  │  │  └─ Enviar por WhatsApp                      │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  │          ↓                                           │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO APROBACIÓN (Cliente)                 │   │              │
│  │  │  ├─ Portal QR Tracking                       │   │              │
│  │  │  ├─ Ver cotización                           │   │              │
│  │  │  └─ Aprobar/Rechazar                         │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  │          ↓                                           │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO REPARACIÓN (Técnico)                 │   │              │
│  │  │  ├─ Usar piezas (FIFO automático)            │   │              │
│  │  │  ├─ Registrar tiempo trabajado               │   │              │
│  │  │  ├─ Checklist POST-reparación                │   │              │
│  │  │  └─ Marcar completado                        │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  │          ↓                                           │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO NOTIFICACIÓN                         │   │              │
│  │  │  ├─ WhatsApp: "Tu equipo está listo"         │   │              │
│  │  │  ├─ SMS                                       │   │              │
│  │  │  └─ Email                                     │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  │          ↓                                           │              │
│  │  ┌──────────────────────────────────────────────┐   │              │
│  │  │  MÓDULO ENTREGA (POS)                        │   │              │
│  │  │  ├─ Cobrar saldo ($total - $anticipo)        │   │              │
│  │  │  ├─ Aplicar anticipo automático              │   │              │
│  │  │  ├─ Generar CFDI con Comp. Pago              │   │              │
│  │  │  ├─ Firma digital entrega                    │   │              │
│  │  │  └─ Calcular comisión técnico                │   │              │
│  │  └──────────────────────────────────────────────┘   │              │
│  └─────────────────────────────────────────────────────┘              │
│                            ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                   BASE DE DATOS (SUPABASE)                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ usuarios │  │ clientes │  │productos │  │ ventas   │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │reparacio │  │anticipos │  │ caja_mov │  │ facturas │      │   │
│  │  │   nes    │  │ clientes │  │   mtos   │  │          │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                            ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              INTEGRACIONES EXTERNAS                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │Facturama │  │ WhatsApp │  │  PayJoy  │  │   IFT    │      │   │
│  │  │CFDI 4.0  │  │Business  │  │ Crédito  │  │  IMEI    │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                            ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      SALIDAS/REPORTES                          │   │
│  │  ├─ Facturas XML/PDF (SAT)                                     │   │
│  │  ├─ Tickets térmicos (recibo, etiquetas)                       │   │
│  │  ├─ Contratos PDF (legal)                                      │   │
│  │  ├─ Reportes Excel (contador, gerencia)                        │   │
│  │  └─ Dashboard gráficas (tiempo real)                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flujo End-to-End Completo

### CASO DE USO 1: Reparación de Celular (Cliente típico)

```
TIEMPO TOTAL: 3-7 días

DÍA 1 - HORA 0:00 (Recepción)
├─ Cliente llega con iPhone 12 con pantalla rota
├─ Recepcionista busca/crea cliente en sistema
├─ Registra datos del dispositivo
├─ Verifica IMEI en portal IFT México ⚠️ OBLIGATORIO
│  └─ Si reportado → RECHAZAR recepción (política empresa)
├─ Hace checklist 15 puntos (pantalla, touch, cámaras, etc.)
├─ Toma 3 fotos del equipo (frontal, trasera, daños)
├─ Cliente firma digitalmente en tablet
├─ Sistema genera folio: REP-2026-000042
├─ Sistema genera QR único para tracking
├─ Imprime 2 copias del contrato + 1 etiqueta adhesiva
├─ Cliente paga anticipo $500 (opcional)
│  └─ Sistema registra en anticipos_clientes (pasivo, NO venta)
├─ Cliente se va con contrato + URL para tracking
└─ TIEMPO: 10 minutos

DÍA 1 - HORA 1:00 (Diagnóstico Técnico)
├─ Juan (técnico) recibe notificación "Nuevo ticket asignado"
├─ Abre ticket REP-2026-000042
├─ Revisa el equipo completo
├─ Diagnóstico: "Pantalla rota + flex dañado"
├─ Genera cotización:
│  ├─ Pantalla original: $1,200
│  ├─ Mano de obra: $300
│  └─ TOTAL: $1,500 (IVA incluido)
├─ Sistema envía automáticamente por WhatsApp al cliente
└─ TIEMPO: 30 minutos

DÍA 1 - HORA 2:00 (Aprobación Cliente)
├─ Cliente recibe WhatsApp con enlace QR
├─ Abre portal: track.crediphonesolutions.mx/abc123
├─ Ve cotización de $1,500
├─ Aprueba la reparación (botón en portal)
├─ Sistema notifica a Juan que fue aprobado
└─ TIEMPO: 5 minutos

DÍA 2 - HORA 10:00 (Reparación)
├─ Juan cambia estado a "Reparando"
├─ Usa pantalla del inventario:
│  └─ Sistema descuenta automáticamente con FIFO (lote más antiguo)
├─ Instala pantalla + flex nuevo
├─ Registra tiempo trabajado: 1.5 horas
├─ Hace checklist POST-reparación (15 puntos)
├─ Toma fotos del equipo reparado
├─ Marca como "Completado"
└─ TIEMPO: 1.5 horas

DÍA 2 - HORA 12:00 (Notificación Lista)
├─ Sistema detecta estado "Completado"
├─ Envía automáticamente:
│  ├─ WhatsApp: "Tu iPhone está listo para recoger"
│  ├─ SMS al número registrado
│  └─ Email (si tiene)
├─ Cambia estado a "Listo para entrega"
└─ TIEMPO: Automático (1 segundo)

DÍA 3 - HORA 14:00 (Entrega)
├─ Cliente llega a recoger
├─ Aly (cajera) abre ticket en POS
├─ Sistema muestra:
│  ├─ Total del servicio: $1,500
│  ├─ Anticipo pagado: -$500
│  └─ SALDO PENDIENTE: $1,000
├─ Cliente paga $1,000 (efectivo)
├─ Sistema:
│  ├─ Aplica anticipo automáticamente
│  ├─ Registra venta completa por $1,500
│  ├─ Calcula comisión Juan (10% de $1,500 = $150)
│  ├─ Crea movimiento en caja (+$1,000 efectivo)
│  ├─ Genera CFDI con Complemento de Pago:
│  │  ├─ Anticipo $500 (Fecha: Día 1)
│  │  └─ Pago final $1,000 (Fecha: Día 3)
│  └─ Envía factura por email (XML + PDF)
├─ Cliente firma digitalmente "Recibido conforme"
├─ Imprime ticket de entrega
├─ Cliente se va feliz con su iPhone reparado
├─ Sistema archiva automáticamente después de 90 días
└─ TIEMPO: 5 minutos
```

---

# SECCIÓN B: ESTRUCTURA DE ARCHIVOS EXACTA

## Árbol de Directorios Completo

```
/crediphone-erp/
│
├── 📁 app/                              # Next.js 14 App Router
│   │
│   ├── 📁 (auth)/                       # Grupo de rutas autenticación
│   │   ├── 📁 login/
│   │   │   └── page.tsx                 # Página de login
│   │   ├── 📁 registro/
│   │   │   └── page.tsx                 # Registro de usuarios (solo admin)
│   │   ├── 📁 recuperar-password/
│   │   │   └── page.tsx                 # Recuperación contraseña
│   │   └── layout.tsx                   # Layout sin navbar/sidebar
│   │
│   ├── 📁 (dashboard)/                  # Grupo de rutas con dashboard
│   │   │
│   │   ├── 📁 admin/                    # ROL: Administrador
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── page.tsx             # Dashboard administrativo
│   │   │   ├── 📁 usuarios/
│   │   │   │   ├── page.tsx             # Lista de usuarios
│   │   │   │   ├── nuevo/page.tsx       # Crear usuario
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Editar usuario
│   │   │   ├── 📁 reportes/
│   │   │   │   ├── page.tsx             # Reportes generales
│   │   │   │   ├── ventas/page.tsx
│   │   │   │   ├── reparaciones/page.tsx
│   │   │   │   ├── inventario/page.tsx
│   │   │   │   └── contador/page.tsx    # Reporte para contador
│   │   │   └── 📁 configuracion/
│   │   │       ├── page.tsx             # Configuración general
│   │   │       ├── empresa/page.tsx
│   │   │       ├── servicios/page.tsx
│   │   │       └── integraciones/page.tsx
│   │   │
│   │   ├── 📁 recepcion/                # ROL: Recepcionista
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── page.tsx             # Dashboard recepción
│   │   │   ├── 📁 nueva/
│   │   │   │   └── page.tsx             # Nueva recepción de equipo
│   │   │   ├── 📁 reparaciones/
│   │   │   │   ├── page.tsx             # Lista de reparaciones
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Ver/Editar reparación
│   │   │   └── 📁 clientes/
│   │   │       ├── page.tsx             # Lista de clientes
│   │   │       └── nuevo/page.tsx       # Nuevo cliente
│   │   │
│   │   ├── 📁 tecnico/                  # ROL: Técnico
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── page.tsx             # Dashboard técnico
│   │   │   └── 📁 mis-reparaciones/
│   │   │       ├── page.tsx             # Reparaciones asignadas
│   │   │       └── [id]/
│   │   │           ├── page.tsx         # Trabajar en reparación
│   │   │           ├── diagnostico/page.tsx
│   │   │           └── completar/page.tsx
│   │   │
│   │   ├── 📁 pos/                      # Punto de Venta
│   │   │   └── page.tsx                 # Interfaz POS
│   │   │
│   │   ├── 📁 inventario/               # Gestión inventario
│   │   │   ├── page.tsx                 # Lista productos
│   │   │   ├── nuevo/page.tsx
│   │   │   ├── alertas/page.tsx         # Stock bajo, vencimientos
│   │   │   ├── entradas/page.tsx        # Compras a proveedores
│   │   │   ├── salidas/page.tsx         # Mermas, ajustes
│   │   │   └── verificacion/page.tsx    # Verificación semanal
│   │   │
│   │   ├── 📁 caja/                     # Módulo de caja
│   │   │   ├── page.tsx                 # Apertura/Estado caja
│   │   │   ├── movimientos/page.tsx
│   │   │   └── cierre/page.tsx          # Corte de caja
│   │   │
│   │   ├── 📁 proveedores/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   └── layout.tsx                   # Layout con navbar/sidebar
│   │
│   ├── 📁 track/                        # Portal público (NO requiere login)
│   │   └── [hash]/
│   │       └── page.tsx                 # Portal de tracking QR para clientes
│   │
│   ├── 📁 api/                          # API Routes
│   │   ├── 📁 auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts             # NextAuth endpoints
│   │   ├── 📁 reparaciones/
│   │   │   ├── route.ts                 # GET, POST /api/reparaciones
│   │   │   └── [id]/
│   │   │       └── route.ts             # GET, PUT, DELETE /api/reparaciones/:id
│   │   ├── 📁 ventas/
│   │   │   └── route.ts
│   │   ├── 📁 facturas/
│   │   │   ├── route.ts                 # Generar CFDI
│   │   │   └── cancelar/route.ts        # Cancelar CFDI
│   │   ├── 📁 inventario/
│   │   │   └── route.ts
│   │   ├── 📁 qr/
│   │   │   └── generar/route.ts         # Generar QR
│   │   ├── 📁 whatsapp/
│   │   │   ├── enviar/route.ts
│   │   │   └── webhook/route.ts         # Recibir respuestas
│   │   └── 📁 imei/
│   │       └── verificar/route.ts       # PhoneCheck API
│   │
│   ├── layout.tsx                       # Root layout
│   ├── globals.css                      # Estilos globales
│   └── not-found.tsx                    # 404 page
│
├── 📁 components/                       # Componentes React
│   │
│   ├── 📁 ui/                           # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── ...                          # ~30 componentes shadcn
│   │
│   ├── 📁 shared/                       # Componentes compartidos
│   │   ├── Navbar.tsx                   # Barra superior
│   │   ├── Sidebar.tsx                  # Menú lateral
│   │   ├── UserMenu.tsx                 # Menú de usuario
│   │   ├── EstadoBadge.tsx              # Badge de estados
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── ProtectedRoute.tsx           # HOC protección de rutas
│   │
│   ├── 📁 reparaciones/                 # Componentes módulo reparaciones
│   │   ├── ChecklistPreReparacion.tsx   # 15 puntos checklist
│   │   ├── ChecklistPostReparacion.tsx
│   │   ├── FormularioRecepcion.tsx      # Form de recepción
│   │   ├── TimelineReparacion.tsx       # Timeline de eventos
│   │   ├── FirmaDigital.tsx             # Captura de firma
│   │   ├── CapturaFotos.tsx             # Subir fotos
│   │   ├── CotizacionForm.tsx           # Generar cotización
│   │   └── TicketImpresion.tsx          # Preview ticket
│   │
│   ├── 📁 pos/                          # Componentes POS
│   │   ├── ProductoSearch.tsx           # Búsqueda de productos
│   │   ├── CarritoCompras.tsx           # Carrito de compras
│   │   ├── PanelPago.tsx                # Panel de cobro
│   │   ├── MetodosPago.tsx              # Múltiples métodos
│   │   └── EscanerCodigoBarras.tsx      # Escaneo con cámara
│   │
│   ├── 📁 inventario/                   # Componentes inventario
│   │   ├── TablaProductos.tsx
│   │   ├── FormProducto.tsx
│   │   ├── AlertasStock.tsx
│   │   └── VerificacionSemanal.tsx
│   │
│   ├── 📁 clientes/                     # Componentes CRM
│   │   ├── FormCliente.tsx
│   │   ├── HistorialCliente.tsx
│   │   └── TarjetaCliente.tsx
│   │
│   ├── 📁 caja/                         # Componentes caja
│   │   ├── AperturaCaja.tsx
│   │   ├── CierreCaja.tsx
│   │   ├── ArqueoCaja.tsx               # Conteo por denominación
│   │   └── MovimientosCaja.tsx
│   │
│   └── 📁 reportes/                     # Componentes reportes
│       ├── GraficaVentas.tsx
│       ├── TablaReparaciones.tsx
│       └── ExportarExcel.tsx
│
├── 📁 lib/                              # Librerías y utilities
│   │
│   ├── 📁 supabase/                     # Supabase config
│   │   ├── client.ts                    # Cliente browser
│   │   ├── server.ts                    # Cliente server
│   │   ├── middleware.ts                # Middleware auth
│   │   └── database.types.ts            # Tipos generados
│   │
│   ├── 📁 facturacion/                  # Módulo facturación
│   │   ├── cfdi.ts                      # Lógica CFDI 4.0
│   │   ├── facturama.ts                 # Cliente API Facturama
│   │   ├── complemento-pago.ts          # Complemento de pago
│   │   └── validaciones.ts              # Validaciones RFC, etc.
│   │
│   ├── 📁 qr/                           # Módulo QR
│   │   ├── generator.ts                 # Generar QR
│   │   ├── scanner.ts                   # Escanear QR
│   │   └── types.ts                     # Tipos QR
│   │
│   ├── 📁 notifications/                # Notificaciones
│   │   ├── whatsapp.ts                  # WhatsApp Business API
│   │   ├── email.ts                     # Resend email
│   │   ├── sms.ts                       # Twilio SMS
│   │   └── push.ts                      # FCM push notifications
│   │
│   ├── 📁 imei/                         # Verificación IMEI
│   │   ├── phonecheck.ts                # PhoneCheck API
│   │   └── ift.ts                       # IFT México (manual)
│   │
│   ├── 📁 utils/                        # Utilidades generales
│   │   ├── folios.ts                    # Generar folios únicos
│   │   ├── formatters.ts                # Formatear dinero, fechas
│   │   ├── validators.ts                # Validaciones varias
│   │   ├── fifo.ts                      # Lógica FIFO inventario
│   │   └── constants.ts                 # Constantes del sistema
│   │
│   ├── 📁 hooks/                        # React hooks custom
│   │   ├── useAuth.ts                   # Hook de autenticación
│   │   ├── useReparaciones.ts           # CRUD reparaciones
│   │   ├── useInventario.ts             # Gestión inventario
│   │   ├── useClientes.ts               # Gestión clientes
│   │   ├── useVentas.ts                 # POS
│   │   └── useCaja.ts                   # Caja
│   │
│   └── 📁 pdf/                          # Generación PDFs
│       ├── contrato-reparacion.ts       # Template contrato
│       ├── ticket-venta.ts              # Template ticket
│       ├── etiqueta-tecnico.ts          # Template etiqueta
│       └── generator.ts                 # Puppeteer PDF gen
│
├── 📁 types/                            # TypeScript types
│   ├── database.types.ts                # Tipos Supabase (generados)
│   ├── reparaciones.types.ts
│   ├── ventas.types.ts
│   ├── inventario.types.ts
│   ├── usuarios.types.ts
│   └── index.ts                         # Export all types
│
├── 📁 supabase/                         # Supabase local dev
│   ├── 📁 migrations/                   # Migraciones SQL
│   │   ├── 20260101000000_create_usuarios.sql
│   │   ├── 20260101000001_create_clientes.sql
│   │   ├── 20260101000002_create_productos.sql
│   │   ├── 20260101000003_create_reparaciones.sql
│   │   ├── 20260101000004_create_ventas.sql
│   │   ├── ...                          # 25 archivos (1 por tabla)
│   │   ├── 20260101100000_create_triggers.sql
│   │   └── 20260101100001_create_functions.sql
│   │
│   ├── 📁 functions/                    # Edge Functions
│   │   ├── generate-folio/
│   │   │   └── index.ts
│   │   └── send-notification/
│   │       └── index.ts
│   │
│   ├── config.toml                      # Config Supabase local
│   └── seed.sql                         # Datos de prueba
│
├── 📁 public/                           # Assets estáticos
│   ├── 📁 images/
│   │   ├── logo.svg
│   │   └── placeholder-product.png
│   ├── 📁 fonts/
│   │   ├── Inter-Regular.woff2
│   │   └── JetBrainsMono-Regular.woff2
│   └── 📁 icons/
│       └── favicon.ico
│
├── 📁 docs/                             # Documentación
│   ├── DOCUMENTO-MAESTRO.md             # Este documento
│   ├── INSTRUCCIONES-DESARROLLO.md
│   ├── MAPA-REFERENCIA.md
│   └── README-DEV.md
│
├── .env.local                           # Variables de entorno LOCAL
├── .env.example                         # Template de .env
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── README.md                            # Readme del proyecto
```

## Convenciones de Nombres

### Archivos y Carpetas
```
✅ CORRECTO:
- page.tsx (páginas Next.js)
- layout.tsx (layouts Next.js)
- FormularioRecepcion.tsx (componentes con PascalCase)
- useReparaciones.ts (hooks con camelCase)
- cfdi.ts (utilities con kebab-case o camelCase)

❌ INCORRECTO:
- Page.tsx
- formulario-recepcion.tsx
- UseReparaciones.ts
```

### Componentes React
```typescript
// PascalCase para componentes
export default function FormularioRecepcion() {
  return <div>...</div>
}

// camelCase para funciones utilities
export function generarFolio() {
  return "REP-2026-000001"
}

// UPPER_SNAKE_CASE para constantes
export const IVA_RATE = 0.16
export const STORAGE_FEE_PER_DAY = 25
```

---

# SECCIÓN C: MAPA DE NAVEGACIÓN POR ROL

## Navegación Completa del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│              NAVEGACIÓN POR ROL - SIDEBAR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔑 ADMINISTRADOR                                               │
│  ══════════════                                                 │
│  URL Base: /admin                                               │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 📊 Dashboard                  → /admin/dashboard            │
│  ├─ 👥 Usuarios                   → /admin/usuarios             │
│  │  ├─ Nuevo Usuario              → /admin/usuarios/nuevo       │
│  │  └─ Editar Usuario             → /admin/usuarios/[id]        │
│  ├─ 🔧 Reparaciones               → /recepcion/reparaciones     │
│  ├─ 💰 Punto de Venta (POS)       → /pos                        │
│  ├─ 📦 Inventario                 → /inventario                 │
│  │  ├─ Productos                  → /inventario                 │
│  │  ├─ Alertas Stock              → /inventario/alertas         │
│  │  ├─ Entradas                   → /inventario/entradas        │
│  │  └─ Verificación Semanal       → /inventario/verificacion    │
│  ├─ 👨‍💼 Clientes                    → /recepcion/clientes        │
│  ├─ 🏢 Proveedores                → /proveedores                │
│  ├─ 💵 Caja                       → /caja                       │
│  ├─ 📊 Reportes                   → /admin/reportes             │
│  │  ├─ Ventas                     → /admin/reportes/ventas      │
│  │  ├─ Reparaciones               → /admin/reportes/reparaciones│
│  │  ├─ Inventario                 → /admin/reportes/inventario  │
│  │  ├─ Comisiones                 → /admin/reportes/comisiones  │
│  │  └─ Para Contador              → /admin/reportes/contador    │
│  ├─ ⚙️ Configuración              → /admin/configuracion        │
│  │  ├─ Datos de la Empresa        → /admin/configuracion/empresa│
│  │  ├─ Servicios y Precios        → /admin/configuracion/servicios│
│  │  └─ Integraciones              → /admin/configuracion/integraciones│
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  👔 GERENTE                                                     │
│  ══════════                                                     │
│  URL Base: /admin (acceso limitado)                            │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 📊 Dashboard                  → /admin/dashboard            │
│  ├─ 🔧 Reparaciones               → /recepcion/reparaciones     │
│  ├─ 💰 Punto de Venta             → /pos                        │
│  ├─ 📦 Inventario (sin costos)    → /inventario                 │
│  ├─ 👨‍💼 Clientes                    → /recepcion/clientes        │
│  ├─ 🏢 Proveedores                → /proveedores                │
│  ├─ 💵 Caja (solo lectura)        → /caja (read-only)           │
│  ├─ 📊 Reportes                   → /admin/reportes             │
│  │  ├─ Ventas                     → /admin/reportes/ventas      │
│  │  ├─ Reparaciones               → /admin/reportes/reparaciones│
│  │  └─ Inventario (sin costos)    → /admin/reportes/inventario  │
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  ❌ NO TIENE ACCESO:                                            │
│  - Gestión de Usuarios                                          │
│  - Configuración del Sistema                                    │
│  - Reportes de Costos (precio_compra oculto)                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  👤 RECEPCIONISTA                                               │
│  ════════════════                                               │
│  URL Base: /recepcion                                           │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 📊 Dashboard                  → /recepcion/dashboard        │
│  ├─ ➕ Nueva Reparación           → /recepcion/nueva            │
│  ├─ 🔧 Reparaciones               → /recepcion/reparaciones     │
│  │  └─ Ver/Editar Reparación      → /recepcion/reparaciones/[id]│
│  ├─ 👨‍💼 Clientes                    → /recepcion/clientes        │
│  │  ├─ Lista de Clientes          → /recepcion/clientes         │
│  │  └─ Nuevo Cliente              → /recepcion/clientes/nuevo   │
│  ├─ 💰 Punto de Venta             → /pos                        │
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  ❌ NO TIENE ACCESO:                                            │
│  - Usuarios, Reportes, Configuración, Inventario Completo       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔧 TÉCNICO                                                     │
│  ══════════                                                     │
│  URL Base: /tecnico                                             │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 📊 Dashboard                  → /tecnico/dashboard          │
│  ├─ 🔧 Mis Reparaciones           → /tecnico/mis-reparaciones   │
│  │  └─ Trabajar en Reparación     → /tecnico/mis-reparaciones/[id]│
│  │      ├─ Diagnóstico            → /tecnico/mis-reparaciones/[id]/diagnostico│
│  │      └─ Completar              → /tecnico/mis-reparaciones/[id]/completar│
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  PERMISOS ESPECIALES:                                           │
│  - Puede usar piezas del inventario (descuento automático)      │
│  - Solo ve reparaciones asignadas a él                          │
│  - NO puede ver costos de piezas                                │
│                                                                 │
│  ❌ NO TIENE ACCESO:                                            │
│  - POS, Clientes, Reportes, Config, Todo lo demás               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💰 CAJERO                                                      │
│  ═════════                                                      │
│  URL Base: /pos, /caja                                          │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 💰 Punto de Venta             → /pos                        │
│  ├─ 💵 Caja                       → /caja                       │
│  │  ├─ Abrir Caja                 → /caja (botón acción)        │
│  │  ├─ Movimientos                → /caja/movimientos           │
│  │  └─ Cerrar Caja                → /caja/cierre                │
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  ❌ NO TIENE ACCESO:                                            │
│  - Reparaciones, Clientes, Inventario, Reportes, Config         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📊 AUDITOR                                                     │
│  ═════════                                                      │
│  URL Base: /reportes                                            │
│                                                                 │
│  Sidebar Items:                                                 │
│  ├─ 📊 Dashboard Reportes         → /admin/reportes             │
│  │  ├─ Ventas                     → /admin/reportes/ventas      │
│  │  ├─ Reparaciones               → /admin/reportes/reparaciones│
│  │  ├─ Inventario                 → /admin/reportes/inventario  │
│  │  └─ Comisiones                 → /admin/reportes/comisiones  │
│  ├─ 📥 Exportar Datos             → (botones en cada reporte)   │
│  ├─ 📜 Audit Log                  → /admin/audit-log            │
│  └─ 🚪 Cerrar Sesión              → /api/auth/signout           │
│                                                                 │
│  MODO: SOLO LECTURA (read-only en TODO)                        │
│                                                                 │
│  ❌ NO PUEDE:                                                   │
│  - Crear, Modificar o Eliminar NADA                             │
│  - Solo puede VER y EXPORTAR                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# SECCIÓN D: MAPA CONSOLIDADO DE TABLAS

## Todas las Tablas del Sistema (25 Total)

```
┌─────────────────────────────────────────────────────────────────┐
│           BASE DE DATOS - 25 TABLAS ORGANIZADAS                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 TABLAS MAESTRAS (Entidades Principales) - 6 tablas          │
│  ══════════════════════════════════════════════════════         │
│                                                                 │
│  1. usuarios                                                    │
│     - Empleados del sistema (admin, gerente, técnico, etc.)    │
│     - Autenticación (password_hash, 2FA)                        │
│     - Roles y permisos (JSONB)                                  │
│     - Comisiones por reparación/venta                           │
│     - Row Level Security (RLS) aplicado                         │
│                                                                 │
│  2. clientes                                                    │
│     - Base de clientes del negocio                              │
│     - Datos personales (nombre, teléfono, email)                │
│     - Dirección completa                                        │
│     - Datos fiscales opcionales (RFC, razón social)             │
│     - Clasificación (tipo, nivel: normal/vip/frecuente)         │
│     - Estadísticas (total_reparaciones, monto_gastado)          │
│                                                                 │
│  3. productos                                                   │
│     - Catálogo completo de productos/piezas                     │
│     - SKU único, códigos de barras                              │
│     - Clasificación (categoría, marca, modelo)                  │
│     - Inventario (stock_actual, stock_mínimo, stock_máximo)     │
│     - Precios (compra, venta, mayoreo) - IVA incluido           │
│     - Tipo (accesorio, pieza, equipo nuevo/usado, servicio)     │
│     - Control especial (serializado/IMEI, lote, caducidad)      │
│                                                                 │
│  4. categorias                                                  │
│     - Clasificación jerárquica de productos                     │
│     - Estructura padre-hijo (árbol)                             │
│     - Ejemplo: Pantallas → iPhone → iPhone 12 Pro              │
│                                                                 │
│  5. proveedores                                                 │
│     - Proveedores de piezas y productos                         │
│     - Datos fiscales completos                                  │
│     - Contactos múltiples                                       │
│     - Condiciones de pago                                       │
│     - Historial de compras                                      │
│                                                                 │
│  6. sucursales                                                  │
│     - Múltiples ubicaciones del negocio                         │
│     - Dirección, teléfono, horario                              │
│     - Configuración por sucursal                                │
│     - Estado activo/inactivo                                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💼 TABLAS TRANSACCIONALES (Operaciones del Día) - 8 tablas     │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  7. reparaciones ⭐ CORE                                        │
│     - Folio único (REP-2026-000001)                             │
│     - Cliente asociado                                          │
│     - Dispositivo completo (tipo, marca, modelo, IMEI, etc.)    │
│     - Problema reportado                                        │
│     - Diagnóstico técnico                                       │
│     - Cotización (JSONB con desglose)                           │
│     - Estados (recibido, diagnosticando, reparando, etc.)       │
│     - Fechas (recepción, diagnóstico, cotización, etc.)         │
│     - Checklist PRE y POST reparación (JSONB)                   │
│     - Fotos (arrays: recepción, diagnóstico, reparación)        │
│     - Firmas digitales (recepción, entrega) Base64              │
│     - QR hash único para tracking                               │
│     - Anticipo pagado, saldo pendiente                          │
│     - Garantía (90 días default)                                │
│     - Técnico asignado (usuario_id)                             │
│                                                                 │
│  8. ventas                                                      │
│     - Folio único (VENTA-2026-000001)                           │
│     - Tipo (venta_mostrador, reparacion_entrega, payjoy, etc.)  │
│     - Cliente asociado (opcional)                               │
│     - Montos (subtotal, descuento, impuestos, total)            │
│     - Métodos de pago (JSONB array - múltiples métodos)         │
│     - Cambio calculado                                          │
│     - Reparación asociada (si es entrega)                       │
│     - Vendedor (usuario_id)                                     │
│     - Comisión generada (calculada automática)                  │
│     - Factura asociada (factura_id)                             │
│     - Estado (completada, cancelada, devolucion)                │
│                                                                 │
│  9. venta_items                                                 │
│     - Detalle de cada item vendido                              │
│     - Producto asociado                                         │
│     - Nombre, SKU (snapshot en el momento)                      │
│     - Serie/IMEI si producto serializado                        │
│     - Cantidad                                                  │
│     - Precio unitario (snapshot)                                │
│     - Descuento por item                                        │
│     - Subtotal, impuestos, total                                │
│     - Costo unitario (para cálculo de utilidad)                 │
│     - Lote, fecha caducidad                                     │
│                                                                 │
│  10. anticipos_clientes ⭐ PASIVO CONTABLE                      │
│      - Reparación asociada                                      │
│      - Cliente asociado                                         │
│      - Folio de reparación                                      │
│      - Monto del anticipo                                       │
│      - Método de pago (efectivo, tarjeta, transferencia)        │
│      - Estado (pendiente, aplicado, devuelto, cancelado)        │
│      - Fechas (anticipo, aplicado, devuelto)                    │
│      - Venta donde se aplicó (cuando se entrega)                │
│      - Requiere CFDI (boolean)                                  │
│      - UUID CFDI del anticipo (si empresa)                      │
│                                                                 │
│  11. caja_movimientos                                           │
│      - Todos los movimientos de caja                            │
│      - Caja apertura asociada                                   │
│      - Tipo (venta, anticipo, retiro, gasto, etc.)              │
│      - Monto                                                    │
│      - Tipo movimiento (+/-)                                    │
│      - Método de pago                                           │
│      - Referencia (tipo, id, folio)                             │
│      - Concepto                                                 │
│      - Realizado por (usuario)                                  │
│      - Autorizado por (si aplica)                               │
│      - Confirmado, cancelado                                    │
│                                                                 │
│  12. caja_aperturas                                             │
│      - Turnos de caja                                           │
│      - Usuario que abre                                         │
│      - Monto inicial (fondo)                                    │
│      - Fecha/hora apertura                                      │
│      - Fecha/hora cierre                                        │
│      - Monto final                                              │
│      - Diferencia (faltante/sobrante)                           │
│      - Estado (abierta, cerrada)                                │
│      - Sucursal                                                 │
│                                                                 │
│  13. facturas ⭐ CFDI 4.0                                       │
│      - UUID SAT único                                           │
│      - Serie y folio                                            │
│      - Tipo comprobante (I=Ingreso, E=Egreso, P=Pago)           │
│      - Venta asociada                                           │
│      - Reparación asociada (si aplica)                          │
│      - Emisor (RFC, nombre, régimen)                            │
│      - Receptor (RFC, nombre, uso CFDI, régimen)                │
│      - Montos (subtotal, descuento, total, impuestos)           │
│      - Método pago (PUE, PPD)                                   │
│      - Forma pago (01=Efectivo, 03=Transferencia, etc.)         │
│      - Archivos (XML text, PDF URL)                             │
│      - Complemento Pago (JSONB si aplica)                       │
│      - Datos de timbrado SAT                                    │
│      - Status (vigente, cancelado)                              │
│      - UUID sustitución (si se canceló)                         │
│                                                                 │
│  14. purchase_orders                                            │
│      - Órdenes de compra a proveedores                          │
│      - Folio único (OC-2026-000001)                             │
│      - Proveedor asociado                                       │
│      - Fechas (orden, entrega esperada, entrega real)           │
│      - Montos (subtotal, descuento, impuestos, total)           │
│      - Estado (borrador, enviada, recibida, etc.)               │
│      - Creado por, aprobado por, recibido por                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📦 TABLAS DE DETALLE (Líneas de Transacciones) - 4 tablas      │
│  ══════════════════════════════════════════════════════════    │
│                                                                 │
│  15. purchase_order_items                                       │
│      - Items de órdenes de compra                               │
│      - Producto asociado                                        │
│      - Cantidad ordenada                                        │
│      - Cantidad recibida                                        │
│      - Precio unitario                                          │
│      - Lote asignado al recibir                                 │
│                                                                 │
│  16. stock_items_locations                                      │
│      - Stock por ubicación física y lote                        │
│      - Producto asociado                                        │
│      - Ubicación física (estante)                               │
│      - Cantidad                                                 │
│      - Lote                                                     │
│      - Fecha entrada                                            │
│      - Fecha vencimiento (si aplica)                            │
│      - Precio compra (para FIFO)                                │
│      - Constraint UNIQUE (producto, ubicación, lote) para FIFO  │
│                                                                 │
│  17. repair_timeline_events                                     │
│      - Timeline completo de reparación                          │
│      - Reparación asociada                                      │
│      - Tipo evento (created, diagnosed, approved, etc.)         │
│      - Título y descripción                                     │
│      - Usuario que ejecutó                                      │
│      - Metadata (JSONB con datos adicionales)                   │
│      - Visible al cliente (boolean)                             │
│                                                                 │
│  18. time_logs                                                  │
│      - Registro de tiempo trabajado por técnico                 │
│      - Reparación asociada                                      │
│      - Técnico asociado                                         │
│      - Fecha/hora inicio                                        │
│      - Fecha/hora pausa                                         │
│      - Fecha/hora fin                                           │
│      - Segundos transcurridos                                   │
│      - Is running (boolean - está corriendo?)                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔧 TABLAS DE SISTEMA (Configuración y Control) - 6 tablas      │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  19. stock_locations                                            │
│      - Ubicaciones físicas en el negocio                        │
│      - Code único (A-1, B-3, MESA-TECNICO, etc.)                │
│      - Nombre descriptivo                                       │
│      - Parent ID (jerarquía)                                    │
│      - Tipo (estante, mesa_trabajo, zona_listos, almacen)       │
│      - Capacidad, cantidad actual                               │
│      - QR hash (opcional)                                       │
│      - Activo                                                   │
│                                                                 │
│  20. stock_alerts                                               │
│      - Alertas automáticas de inventario                        │
│      - Producto asociado                                        │
│      - Tipo alerta (low_stock, out_of_stock, expiring_soon)     │
│      - Mensaje                                                  │
│      - Prioridad (low, normal, high, critical)                  │
│      - Fecha alerta                                             │
│      - Resuelto (boolean)                                       │
│      - Resuelto por (usuario)                                   │
│                                                                 │
│  21. qr_tracking                                                │
│      - Gestión de códigos QR del sistema                        │
│      - QR hash único (12 caracteres)                            │
│      - Tipo QR (ticket, location, action, employee)             │
│      - Reparación asociada (si ticket)                          │
│      - Location asociada (si ubicación)                         │
│      - QR data (JSONB)                                          │
│      - QR image URL                                             │
│      - Public URL                                               │
│      - Activo                                                   │
│      - Expires at                                               │
│                                                                 │
│  22. push_tokens                                                │
│      - Tokens para notificaciones push (FCM)                    │
│      - Usuario asociado                                         │
│      - Token (text unique)                                      │
│      - Device type (web, android, ios)                          │
│      - Device name                                              │
│      - Activo                                                   │
│      - Last used at                                             │
│                                                                 │
│  23. audit_log                                                  │
│      - Log de auditoría completo                                │
│      - Usuario que ejecutó acción                               │
│      - Acción ejecutada (create, update, delete, login, etc.)   │
│      - Tabla afectada                                           │
│      - Record ID afectado                                       │
│      - Valores anteriores (JSONB)                               │
│      - Valores nuevos (JSONB)                                   │
│      - IP address                                               │
│      - User agent                                               │
│      - Timestamp                                                │
│                                                                 │
│  24. offline_sync_queue                                         │
│      - Cola de sincronización para modo offline                 │
│      - Usuario asociado                                         │
│      - Acción (create, update, delete)                          │
│      - Tabla objetivo                                           │
│      - Data (JSONB)                                             │
│      - Timestamp creación                                       │
│      - Sincronizado (boolean)                                   │
│      - Timestamp sincronización                                 │
│      - Errores (text)                                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🤖 TABLAS ML/ANALYTICS (Machine Learning) - 1 tabla            │
│  ═══════════════════════════════════════════════════════       │
│                                                                 │
│  25. historical_prices                                          │
│      - Datos históricos para ML                                 │
│      - Dispositivo (marca, modelo)                              │
│      - Tipo servicio                                            │
│      - Precio promedio                                          │
│      - Mano obra promedio                                       │
│      - Tiempo promedio (minutos)                                │
│      - Número de ocurrencias                                    │
│      - Última actualización                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

TOTAL: 25 TABLAS
```

## Relaciones Principales Entre Tablas

```
reparaciones (CORE)
├─ FK → clientes (cliente_id)
├─ FK → usuarios (tecnico_id)
├─ FK → sucursales (sucursal_id)
├─ FK → ventas (venta_id cuando se entrega)
│
├─ HAS MANY → anticipos_clientes
├─ HAS MANY → repair_timeline_events
├─ HAS MANY → time_logs
└─ HAS ONE → qr_tracking

ventas
├─ FK → clientes (cliente_id)
├─ FK → usuarios (vendedor_id)
├─ FK → reparaciones (reparacion_id si entrega)
├─ FK → facturas (factura_id)
│
└─ HAS MANY → venta_items

productos
├─ FK → categorias (categoria_id)
├─ FK → proveedores (proveedor_id)
│
├─ HAS MANY → stock_items_locations (stock por ubicación/lote)
├─ HAS MANY → stock_alerts
└─ HAS MANY → venta_items

usuarios
├─ FK → sucursales (sucursal_principal_id)
│
├─ HAS MANY → reparaciones (como técnico)
├─ HAS MANY → ventas (como vendedor)
├─ HAS MANY → caja_aperturas
└─ HAS MANY → push_tokens
```

---

# SECCIÓN E: FLUJOS PRINCIPALES DEL SISTEMA (Completos)

## Los 3 Flujos Críticos

### FLUJO 1: REPARACIÓN COMPLETA (END-TO-END)

Ver sección anterior (ya documentado en Visión General)

### FLUJO 2: VENTA POS (MOSTRADOR) - DETALLADO

```
═══════════════════════════════════════════════════════════════
FLUJO COMPLETO: VENTA EN MOSTRADOR
═══════════════════════════════════════════════════════════════

TIEMPO TOTAL: 3-5 minutos

PASO 1: BÚSQUEDA DE PRODUCTOS (30 segundos)
├─ Cajero escanea código de barras con lector USB
│  O
├─ Cajero busca por nombre/SKU en buscador
│
├─ Sistema verifica:
│  ├─ ¿Producto existe? → SI → continuar
│  │                      NO → mostrar error
│  ├─ ¿Hay stock disponible? → SI → continuar
│  │                           NO → alert "Sin stock"
│  └─ ¿Es serializado (IMEI)? → SI → pedir IMEI/Serie
│                                NO → solo cantidad
│
└─ Agregar al carrito

PASO 2: CARRITO DE COMPRAS (1 minuto)
├─ Mostrar items en carrito:
│  ├─ Nombre producto
│  ├─ SKU
│  ├─ Cantidad (con botones +/-)
│  ├─ Precio unitario (IVA incluido)
│  └─ Subtotal
│
├─ Opciones:
│  ├─ Modificar cantidades
│  ├─ Eliminar items
│  └─ [OPCIONAL] Aplicar descuento (si tiene permiso)
│      └─ Admin/Gerente: Hasta 50%
│      └─ Cajero: Hasta 10%
│
└─ Calcular total:
    ├─ Subtotal
    ├─ Descuento (si aplica)
    └─ TOTAL (IVA ya incluido)

PASO 3: MÉTODO DE PAGO (1 minuto)
├─ Opciones:
│  ├─ 💵 EFECTIVO
│  │  ├─ Input: Monto recibido
│  │  ├─ Sistema calcula cambio
│  │  └─ Mostrar cambio en grande
│  │
│  ├─ 💳 TARJETA
│  │  ├─ Tipo: Débito/Crédito
│  │  ├─ Input: Referencia/Autorización
│  │  └─ Cambio: $0
│  │
│  ├─ 🏦 TRANSFERENCIA
│  │  ├─ Input: Referencia
│  │  └─ Cambio: $0
│  │
│  └─ 🔀 PAGO MIXTO
│      ├─ Ejemplo: $500 efectivo + $500 tarjeta
│      ├─ Input: Monto por cada método
│      └─ Validar que sume = total
│
└─ Confirmar pago

PASO 4: PROCESAMIENTO BACKEND (automático - 1 segundo)
├─ 1. Crear registro en tabla `ventas`:
│     ├─ Folio: VENTA-2026-000123
│     ├─ Tipo: "venta_mostrador"
│     ├─ Cliente: NULL (venta sin cliente)
│     ├─ Subtotal: $800
│     ├─ Descuento: $0
│     ├─ Total: $800
│     ├─ Métodos pago: [{"tipo":"efectivo","monto":800}]
│     ├─ Cambio: $200
│     └─ Vendedor: usuario_id actual
│
├─ 2. Crear items en tabla `venta_items`:
│     └─ Por cada producto en carrito:
│         ├─ venta_id: (de arriba)
│         ├─ producto_id
│         ├─ nombre: (snapshot)
│         ├─ sku: (snapshot)
│         ├─ serie/imei: (si serializado)
│         ├─ cantidad
│         ├─ precio_unitario: (snapshot)
│         ├─ subtotal
│         └─ total
│
├─ 3. Trigger automático: actualizar_stock_venta()
│     └─ Por cada item:
│         ├─ Llamar calcular_fifo_salida(producto_id, cantidad)
│         ├─ Descontar de stock_items_locations (FIFO)
│         ├─ Actualizar productos.stock_actual
│         └─ Si llegó a stock_mínimo → crear stock_alert
│
├─ 4. Calcular comisión del vendedor (trigger)
│     ├─ Si vendedor tiene comision_venta > 0:
│     │  ├─ Calcular: total * (comision_venta / 100)
│     │  └─ Actualizar ventas.comision_generada
│     └─ Sino → comision_generada = 0
│
├─ 5. Registrar movimiento en caja
│     └─ Insertar en caja_movimientos:
│         ├─ tipo: "venta"
│         ├─ monto: $800
│         ├─ tipo_movimiento: "+"
│         ├─ metodo_pago: "efectivo"
│         ├─ referencia_tipo: "venta"
│         ├─ referencia_id: venta.id
│         └─ concepto: "Venta VENTA-2026-000123"
│
└─ 6. [OPCIONAL] Generar CFDI si cliente lo pide
    └─ Si cliente requiere factura:
        ├─ Pedir datos fiscales (RFC)
        ├─ Llamar API Facturama
        ├─ Generar CFDI 4.0
        ├─ Guardar en tabla facturas
        └─ Enviar por email

PASO 5: IMPRESIÓN (10 segundos)
├─ Imprimir ticket térmico 58mm:
│   ├─ Logo CREDIPHONE
│   ├─ Datos empresa
│   ├─ Folio: VENTA-2026-000123
│   ├─ Fecha/hora
│   ├─ Items vendidos
│   ├─ Total
│   ├─ Método pago
│   ├─ Cambio
│   ├─ Atendió: (nombre cajero)
│   └─ Mensaje: "Gracias por su compra"
│
└─ [OPCIONAL] Imprimir factura (si la generó)
    └─ PDF tamaño carta

PASO 6: FINALIZACIÓN
├─ Limpiar carrito
├─ Regresar a pantalla inicial POS
├─ Abrir cajón de dinero
└─ Entregar ticket + cambio al cliente

═══════════════════════════════════════════════════════════════
```

### FLUJO 3: GESTIÓN DE INVENTARIO (FIFO) - DETALLADO

```
═══════════════════════════════════════════════════════════════
FLUJO COMPLETO: GESTIÓN DE INVENTARIO CON FIFO
═══════════════════════════════════════════════════════════════

ESCENARIO 1: ENTRADA DE INVENTARIO (Compra a Proveedor)
──────────────────────────────────────────────────────────

TIEMPO TOTAL: 10-15 minutos

PASO 1: CREAR ORDEN DE COMPRA
├─ Ir a /inventario/entradas
├─ Seleccionar proveedor
├─ Agregar productos:
│   ├─ Producto: Pantalla iPhone 12
│   ├─ Cantidad ordenada: 10 unidades
│   └─ Precio unitario: $800 MXN
│
├─ Guardar como "Borrador"
└─ [OPCIONAL] Enviar OC al proveedor por email

PASO 2: RECIBIR MERCANCÍA
├─ Proveedor entrega mercancía
├─ Abrir orden de compra
├─ Marcar "Recibiendo mercancía"
│
├─ Por cada producto:
│   ├─ Cantidad recibida: 10 (o menos si faltaron)
│   ├─ Lote: LOTE-2026-PANT-001 (generar automático)
│   ├─ Fecha vencimiento: NULL (pantallas no caducan)
│   ├─ Precio compra: $800 (capturar)
│   └─ Ubicación física: A-3 (seleccionar estante)
│
└─ Confirmar recepción

PASO 3: PROCESAMIENTO BACKEND (automático)
├─ 1. Actualizar purchase_order_items:
│     └─ cantidad_recibida = 10
│
├─ 2. Insertar en stock_items_locations:
│     ├─ producto_id: (pantalla iPhone 12)
│     ├─ location_id: (estante A-3)
│     ├─ quantity: 10
│     ├─ lote: "LOTE-2026-PANT-001"
│     ├─ fecha_entrada: HOY
│     ├─ precio_compra: $800
│     └─ fecha_vencimiento: NULL
│
├─ 3. Actualizar productos.stock_actual:
│     └─ stock_actual = stock_actual + 10
│
└─ 4. Verificar alertas:
    └─ Si había alert "out_of_stock" → resolverla

ESCENARIO 2: SALIDA DE INVENTARIO (Venta o Reparación)
────────────────────────────────────────────────────────

PASO 1: VENTA/USO DE PIEZA
├─ Cliente compra 3 pantallas iPhone 12
│  O
└─ Técnico usa 1 pantalla en reparación

PASO 2: SISTEMA APLICA FIFO AUTOMÁTICO
├─ Trigger: actualizar_stock_venta() se ejecuta
│  O
├─ Función: calcular_fifo_salida(producto_id, cantidad)
│
├─ Lógica FIFO:
│   SELECT * FROM stock_items_locations
│   WHERE producto_id = 'pantalla_iphone12'
│   AND quantity > 0
│   ORDER BY fecha_entrada ASC  ← MÁS ANTIGUO PRIMERO
│
│   Ejemplo resultado:
│   1. LOTE-2026-PANT-001, ubicación A-3, qty: 10, fecha: 2026-01-10
│   2. LOTE-2026-PANT-002, ubicación B-2, qty: 15, fecha: 2026-01-25
│   3. LOTE-2026-PANT-003, ubicación A-3, qty: 8,  fecha: 2026-02-05
│
│   Necesito: 3 unidades
│   ├─ Tomar 3 del LOTE-001 (más antiguo)
│   ├─ LOTE-001 queda con 7 unidades
│   └─ NO toca LOTE-002 ni LOTE-003
│
│   Si necesitara 12 unidades:
│   ├─ Tomar 10 del LOTE-001 (se agota)
│   ├─ Tomar 2 del LOTE-002
│   ├─ LOTE-001 = 0 (borrar o marcar qty=0)
│   └─ LOTE-002 queda con 13

├─ Actualizar stock_items_locations:
│   UPDATE stock_items_locations
│   SET quantity = quantity - 3
│   WHERE lote = 'LOTE-2026-PANT-001'
│
└─ Actualizar productos.stock_actual:
    UPDATE productos
    SET stock_actual = stock_actual - 3
    WHERE id = 'pantalla_iphone12'

PASO 3: VERIFICAR ALERTAS
└─ Si nuevo stock_actual <= stock_minimo:
    └─ Crear stock_alert:
        ├─ alert_type: "low_stock"
        ├─ priority: "high"
        └─ message: "Pantalla iPhone 12 - Stock bajo (7/10)"

ESCENARIO 3: VERIFICACIÓN SEMANAL DE INVENTARIO
─────────────────────────────────────────────────

TIEMPO: 30-45 minutos (depende cantidad productos)

PASO 1: INICIAR VERIFICACIÓN
├─ Ir a /inventario/verificacion
├─ Sistema muestra mensaje:
│   "Verificación semanal pendiente
│    Última verificación: 01/02/2026
│    Debe hacerse cada viernes o sábado"
│
└─ Botón: "Iniciar Verificación"

PASO 2: ESCANEO DE PRODUCTOS
├─ Sistema NO muestra cantidades esperadas
│   (para evitar sesgo del verificador)
│
├─ Por cada producto:
│   ├─ Escanear código de barras / QR
│   │
│   ├─ SI producto es serializado (IMEI):
│   │  ├─ Escanear cada unidad individualmente
│   │  ├─ Sistema registra cada IMEI único
│   │  └─ Si IMEI se escanea 2 veces → ALERTA
│   │
│   └─ SI producto NO es serializado:
│       ├─ Input: Cantidad física contada
│       └─ Registrar
│
└─ Repetir hasta terminar todos los productos

PASO 3: DETECCIÓN DE DISCREPANCIAS
├─ Sistema compara:
│   ├─ Cantidad sistema (stock_actual)
│   VS
│   └─ Cantidad física (contada)
│
├─ SI hay diferencia:
│   ├─ Generar alerta para admin
│   ├─ Motivos posibles:
│   │  ├─ Robo
│   │  ├─ Pérdida
│   │  ├─ Merma no registrada
│   │  └─ Error de captura
│   │
│   └─ Admin debe:
│       ├─ Investigar causa
│       ├─ Ajustar inventario (con justificación)
│       └─ Actualizar stock_actual al real
│
└─ SI todo cuadra:
    └─ Marcar verificación como exitosa

PASO 4: REPORTE DE VERIFICACIÓN
├─ Generar reporte PDF:
│   ├─ Fecha verificación
│   ├─ Verificado por (usuario)
│   ├─ Total productos verificados
│   ├─ Discrepancias encontradas
│   └─ Ajustes realizados
│
└─ Enviar a admin/gerente

═══════════════════════════════════════════════════════════════
```

---

**FIN SECCIONES COMPLEMENTARIAS**

**ESTAS SECCIONES DEBEN AGREGARSE AL DOCUMENTO MAESTRO FINAL**

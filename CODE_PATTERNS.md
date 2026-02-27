# 🎨 CODE PATTERNS - Patrones Obligatorios

Convenciones y patrones que **TODAS las IAs** deben seguir.

---

## 🔤 NAMING CONVENTIONS

### TypeScript (Frontend/Backend):
```typescript
// ✅ CORRECTO: camelCase
const userName = "Juan";
const getUserData = () => {};
interface PayjoyConfig { }
type PayjoyWebhookPayload = { }

// ❌ INCORRECTO
const user_name = "Juan";  // snake_case
const GetUserData = () => {};  // PascalCase para funciones
```

### SQL (Base de datos):
```sql
-- ✅ CORRECTO: snake_case
CREATE TABLE payjoy_webhooks (
  transaction_id TEXT,
  customer_id TEXT,
  created_at TIMESTAMP
);

-- ❌ INCORRECTO
CREATE TABLE payjoyWebhooks (  -- camelCase
  transactionId TEXT  -- camelCase
);
```

### Archivos y carpetas:
```bash
# ✅ CORRECTO: kebab-case para archivos de componentes
payjoy-config-section.tsx
webhook-handler.ts

# ✅ CORRECTO: camelCase para archivos de lógica
payjoyClient.ts
webhookHandler.ts

# ✅ CORRECTO: PascalCase para componentes React
PayjoyConfigSection.tsx
WebhookStatus.tsx
```

---

## 🗂️ ESTRUCTURA DE ARCHIVOS

### Types:
```typescript
// src/types/payjoy.ts
export interface PayjoyConfig {
  apiKey: string;  // camelCase
  baseUrl: string;
}

export interface PayjoyWebhookPayload {
  transactionId: string;  // camelCase
  customerId: string;
}
```

### Database Functions:
```typescript
// src/lib/db/payjoy.ts
import { createAdminClient } from "@/lib/supabase/admin";

export async function getWebhooksByCredito(creditoId: string) {
  const supabase = createAdminClient();  // ← SIEMPRE usar este patrón

  const { data, error } = await supabase
    .from("payjoy_webhooks")  // ← snake_case (tabla)
    .select("*")
    .eq("credito_id", creditoId);  // ← snake_case (columna)

  if (error) throw error;
  return data.map(mapWebhookFromDB);  // ← Mapear a camelCase
}

// Mapear snake_case → camelCase
function mapWebhookFromDB(db: any) {
  return {
    id: db.id,
    transactionId: db.transaction_id,  // ← camelCase
    customerId: db.customer_id,
    createdAt: new Date(db.created_at),
  };
}
```

### API Routes:
```typescript
// src/app/api/payjoy/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processWebhook } from "@/lib/payjoy/webhook-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processWebhook(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🎯 SUPABASE PATTERNS

### Client-Side (Browser):
```typescript
// ❌ NUNCA usar en client components
import { createAdminClient } from "@/lib/supabase/admin";  // NO

// ✅ USAR ESTO en client
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("productos").select("*");
```

### Server-Side (API Routes, Server Components):
```typescript
// ✅ USAR ESTO en server
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();
const { data } = await supabase.from("productos").select("*");
```

### Middleware:
```typescript
// ✅ USAR ESTO en middleware
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  // ...
}
```

---

## 📝 SQL MIGRATIONS

### Naming:
```
supabase/migrations/faseXX-descripcion-corta.sql
```

### Structure:
```sql
-- =====================================================
-- FASE XX: TÍTULO DESCRIPTIVO
-- =====================================================
-- Descripción completa
-- Fecha: YYYY-MM-DD
-- =====================================================

-- 1. Crear tablas
CREATE TABLE IF NOT EXISTS nombre_tabla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_uno TEXT NOT NULL,
  campo_dos INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Agregar comentarios
COMMENT ON TABLE nombre_tabla IS 'Descripción de la tabla';
COMMENT ON COLUMN nombre_tabla.campo_uno IS 'Descripción del campo';

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_nombre_tabla_campo_uno
ON nombre_tabla(campo_uno);

-- 4. Habilitar RLS
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas
CREATE POLICY "Admin puede todo"
  ON nombre_tabla FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

## 🎨 REACT COMPONENTS

### Component Structure:
```tsx
"use client";  // ← Si usa hooks o state

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface PayjoyConfigSectionProps {  // ← Props interface
  config: PayjoyConfig;
  onUpdate: (config: PayjoyConfig) => void;
}

export function PayjoyConfigSection({  // ← Named export
  config,
  onUpdate
}: PayjoyConfigSectionProps) {
  const [enabled, setEnabled] = useState(config.enabled);

  const handleSave = async () => {
    // Lógica
  };

  return (
    <div className="space-y-4">
      {/* JSX */}
    </div>
  );
}
```

### Tailwind Classes:
```tsx
// ✅ CORRECTO: Clases separadas por categoría
<div className="
  flex items-center gap-4  // Layout
  p-4 rounded-lg  // Spacing & Border
  bg-blue-50 dark:bg-blue-900/20  // Background
  text-gray-900 dark:text-white  // Text
">

// ❌ INCORRECTO: Todo mezclado
<div className="flex p-4 bg-blue-50 items-center text-gray-900 gap-4">
```

---

## ⚠️ ERROR HANDLING

### API Routes:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación
    if (!body.creditoId) {
      return NextResponse.json(
        { success: false, error: "creditoId es requerido" },
        { status: 400 }
      );
    }

    // Lógica
    const result = await someFunction(body.creditoId);

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("Error en endpoint:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Database Functions:
```typescript
export async function getWebhooks(creditoId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payjoy_webhooks")
    .select("*")
    .eq("credito_id", creditoId);

  if (error) throw error;  // ← Propagar error
  return data;
}
```

---

## 🚫 PROHIBIDO

### NUNCA usar:
```typescript
// ❌ NUNCA: any
const data: any = await fetch();

// ✅ USAR: tipos específicos
const data: PayjoyWebhook[] = await fetch();

// ❌ NUNCA: Modificar migraciones existentes
// Si fase20-payjoy-integration.sql ya se aplicó, NO modificar

// ✅ CREAR nueva migration si necesitas cambios
// Archivo: fase20-payjoy-integration-hotfix.sql

// ❌ NUNCA: Hardcodear credenciales
const apiKey = "sk_test_123456";

// ✅ USAR: variables de entorno
const apiKey = process.env.PAYJOY_API_KEY;
```

---

## ✅ CHECKLIST ANTES DE COMMIT

- [ ] TypeScript: camelCase ✅
- [ ] SQL: snake_case ✅
- [ ] Supabase: createAdminClient() en server ✅
- [ ] NO usar `any` ✅
- [ ] Mapeo snake_case ↔ camelCase en database functions ✅
- [ ] Error handling apropiado ✅
- [ ] Comentarios en SQL ✅
- [ ] Props interface para componentes React ✅
- [ ] Variables de entorno (NO hardcode) ✅
- [ ] Actualizar CURRENT_STATE.md ✅

---

## 📚 REFERENCIAS

- Next.js 15: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

**Última actualización:** 2026-02-15 00:00 UTC

# Deploy — CREDIPHONE
> Leer SOLO si hay error en el deploy o necesitas hacer deploy manual.

---

## Deploy Normal (automático) ✅

**Push a `master` → GitHub Actions ejecuta `.github/workflows/deploy.yml` automáticamente.**

```bash
git push origin master   # dispara el workflow automáticamente
```

No se necesita intervención manual en condiciones normales.

---

## Repositorio y acceso

- **Repo:** https://github.com/trinicanales/crediphone (la org `crediphone` fue eliminada)
- **Branch principal:** `master`
- **Token en `.git/config`:** `crediphone-deploy-push-v2` (scope: repo + workflow)
  - Si expira → generar nuevo en https://github.com/settings/tokens
- **GitHub Actions secrets configurados (11):**
  CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PAYJOY_API_KEY, PAYJOY_WEBHOOK_SECRET, INTERNAL_API_SECRET

---

## Destino del deploy

- **Worker:** Cloudflare Workers — nombre `crediphone`
- **URL pública:** https://crediphone.com.mx
- **Cuenta Cloudflare:** 5a93cb5abe3296c3514fa68939da455f (trinicanales@gmail.com)
- **Storage:** Cloudflare R2 bucket `crediphone-storage` (binding `R2_BUCKET`)
- **R2 URL pública:** https://pub-89451411d31c49d9959b166475cda47a.r2.dev

---

## Variables de entorno importantes

Las variables `NEXT_PUBLIC_*` se inyectan en **build time** desde `.env.local`.
**Si cambia alguna variable → hay que hacer rebuild completo (nuevo push a master).**
No se pueden sobreescribir en runtime desde `wrangler.jsonc [vars]`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BASE_URL=https://crediphone.com.mx
NEXT_PUBLIC_APP_URL=https://crediphone.com.mx
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-89451411d31c49d9959b166475cda47a.r2.dev
```

---

## Deploy manual de emergencia (si GitHub Actions no funciona)

Requiere Cloudflare API token con permisos Workers Scripts + R2 + Builds:
```bash
CLOUDFLARE_API_TOKEN=<token> npx opennextjs-cloudflare build
CLOUDFLARE_API_TOKEN=<token> npx opennextjs-cloudflare deploy
```

Token: `crediphone-wrangler-deploy` en dash.cloudflare.com/profile/api-tokens

**Si el deploy se hace desde una VM Cowork:**
Ver `ARCHIVO/DEPLOY-WORKAROUNDS-COWORK.md` — hay parches especiales para el filesystem virtiofs.

---

## Verificación post-deploy

1. Abrir https://crediphone.com.mx
2. Login con cuenta de prueba
3. Verificar que el dashboard cargue sin errores
4. Verificar que las imágenes de productos carguen (R2)

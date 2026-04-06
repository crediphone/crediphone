# Workarounds Deploy — VM Cowork
> Solo leer si el deploy se hace desde la VM de Cowork (filesystem virtiofs).
> En condiciones normales el deploy es automático via GitHub Actions — ver .claude/DEPLOY.md

---

## DEPLOY-BUG-001 — EPERM en filesystem virtiofs

El workspace de Cowork VM usa virtiofs que no permite `unlink` ni `rmdir`.

**Parche necesario** (recrear si la VM se reinicia):
```bash
cat > /tmp/patch-fs-eperm.cjs << 'PATCH_EOF'
const fs = require('fs');
const fsPromises = fs.promises;
const origRmSync = fs.rmSync;
fs.rmSync = function(path, options) { try { return origRmSync.call(this, path, options); } catch(e) { if (e.code !== 'EPERM' && e.code !== 'ENOTEMPTY') throw e; } };
const origRm = fsPromises.rm;
fsPromises.rm = async function(path, options) { try { return await origRm.call(this, path, options); } catch(e) { if (e.code !== 'EPERM' && e.code !== 'ENOTEMPTY') throw e; } };
const origUnlinkSync = fs.unlinkSync;
fs.unlinkSync = function(path) { try { return origUnlinkSync.call(this, path); } catch(e) { if (e.code !== 'EPERM') throw e; } };
const origUnlink = fsPromises.unlink;
fsPromises.unlink = async function(path) { try { return await origUnlink.call(this, path); } catch(e) { if (e.code !== 'EPERM') throw e; } };
const origRmdirSync = fs.rmdirSync;
fs.rmdirSync = function(path, options) { try { return origRmdirSync.call(this, path, options); } catch(e) { if (e.code !== 'EPERM' && e.code !== 'ENOTEMPTY') throw e; } };
const origRmdir = fsPromises.rmdir;
fsPromises.rmdir = async function(path, options) { try { return await origRmdir.call(this, path, options); } catch(e) { if (e.code !== 'EPERM' && e.code !== 'ENOTEMPTY') throw e; } };
PATCH_EOF
```

**Comando de deploy desde VM:**
```bash
cd /sessions/sleepy-confident-hypatia/mnt/crediphone
CLOUDFLARE_API_TOKEN=$(cat .cloudflare-token) \
NODE_OPTIONS="--require /tmp/patch-fs-eperm.cjs" \
npm run deploy:cf 2>&1
```

---

## DEPLOY-BUG-002 — next-env.mjs con exports duplicados

Si el build falla con "Multiple exports with the same name":
```bash
head -3 .open-next/cloudflare/next-env.mjs > /tmp/ne-fix.mjs
cp /tmp/ne-fix.mjs .open-next/cloudflare/next-env.mjs
```

---

## DEPLOY-BUG-005 — Deploy solo (sin rebuild)

Si el build compiló correctamente (139/139 páginas) pero el deploy falló:
```bash
CLOUDFLARE_API_TOKEN=$(cat .cloudflare-token) \
NODE_OPTIONS="--require /tmp/patch-fs-eperm.cjs" \
npx opennextjs-cloudflare deploy 2>&1
```

---

## DEPLOY-BUG-006 — WARNING duplicate-case en handler.mjs

Warning inofensivo del proceso de minificación de Next.js/opennextjs. Ignorar completamente.

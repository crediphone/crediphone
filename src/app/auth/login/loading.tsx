/* ─────────────────────────────────────────────────────────
   loading.tsx — Skeleton de la página de Login
   Se muestra automáticamente por Next.js mientras carga
   la ruta /auth/login (Suspense boundary)
───────────────────────────────────────────────────────── */

export default function LoginLoading() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--color-bg-base)" }}
      aria-hidden="true"
    >
      {/* Panel izquierdo — skeleton oscuro */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12"
        style={{ background: "var(--color-sidebar-bg)" }}
      >
        {/* Logo skeleton */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg animate-pulse"
            style={{ background: "var(--color-sidebar-surface)" }}
          />
          <div
            className="h-3.5 w-28 rounded animate-pulse"
            style={{ background: "var(--color-sidebar-surface)" }}
          />
        </div>

        {/* Ilustración skeleton */}
        <div className="flex flex-col items-center gap-8">
          {/* Teléfono */}
          <div
            className="w-40 h-72 rounded-2xl animate-pulse"
            style={{ background: "var(--color-sidebar-surface)" }}
          />
          {/* Badges */}
          <div className="flex gap-2">
            {[56, 72, 64].map((w) => (
              <div
                key={w}
                className="h-7 rounded-full animate-pulse"
                style={{ width: `${w}px`, background: "var(--color-sidebar-surface)" }}
              />
            ))}
          </div>
        </div>

        {/* Texto inferior skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-56 rounded animate-pulse" style={{ background: "var(--color-sidebar-surface)" }} />
          <div className="h-8 w-40 rounded animate-pulse" style={{ background: "var(--color-sidebar-surface)" }} />
          <div className="h-4 w-72 rounded animate-pulse mt-3" style={{ background: "var(--color-sidebar-surface)" }} />
          <div className="h-4 w-56 rounded animate-pulse" style={{ background: "var(--color-sidebar-surface)" }} />
        </div>
      </div>

      {/* Panel derecho — skeleton formulario */}
      <div
        className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14"
        style={{ background: "var(--color-bg-surface)" }}
      >
        <div className="w-full max-w-sm space-y-6">

          {/* Cabecera */}
          <div className="space-y-2 mb-8">
            <div
              className="h-8 w-40 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
            <div
              className="h-4 w-56 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
          </div>

          {/* Tabs */}
          <div
            className="flex rounded-lg p-1 gap-1 animate-pulse"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <div className="flex-1 h-9 rounded-md" style={{ background: "var(--color-bg-surface)" }} />
            <div className="flex-1 h-9 rounded-md" style={{ background: "transparent" }} />
          </div>

          {/* Campo email */}
          <div className="space-y-1.5">
            <div
              className="h-4 w-32 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
            <div
              className="h-12 w-full rounded-lg animate-pulse"
              style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-subtle)" }}
            />
          </div>

          {/* Campo password */}
          <div className="space-y-1.5">
            <div
              className="h-4 w-24 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
            <div
              className="h-12 w-full rounded-lg animate-pulse"
              style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-subtle)" }}
            />
          </div>

          {/* Recordarme + enlace */}
          <div className="flex items-center justify-between">
            <div
              className="h-4 w-28 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
            <div
              className="h-4 w-40 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
          </div>

          {/* Botón principal */}
          <div
            className="h-12 w-full rounded-lg animate-pulse"
            style={{ background: "var(--color-primary)", opacity: 0.4 }}
          />

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--color-border-subtle)" }} />
            <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />
            <div className="flex-1 h-px" style={{ background: "var(--color-border-subtle)" }} />
          </div>

          {/* Botón secundario */}
          <div
            className="h-12 w-full rounded-lg animate-pulse"
            style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
          />

          {/* Pie */}
          <div
            className="pt-6 flex justify-center"
            style={{ borderTop: "1px solid var(--color-border-subtle)" }}
          >
            <div
              className="h-3 w-64 rounded animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

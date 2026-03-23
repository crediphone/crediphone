/**
 * POST /api/print/network
 * Envía datos ESC/POS a una impresora de red vía TCP (puerto 9100).
 *
 * Body: { ip: string, port?: number, data: string (base64) }
 *
 * Esto es necesario porque los navegadores no pueden abrir conexiones TCP
 * directamente. El servidor Next.js actúa de proxy.
 *
 * Seguridad: solo acepta IPs de red privada (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 * para evitar que se use como proxy hacia Internet.
 */

import { NextRequest, NextResponse } from "next/server";
import net from "net";
import { getAuthContext } from "@/lib/auth/server";

const MAX_DATA_SIZE = 1024 * 64; // 64 KB máximo por ticket
const CONNECT_TIMEOUT_MS = 5000;

export async function POST(request: NextRequest) {
  // Auth — solo usuarios autenticados pueden enviar a impresoras de red
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  let body: { ip?: string; port?: number; data?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 });
  }

  const { ip, port = 9100, data } = body;

  // Validaciones
  if (!ip || typeof ip !== "string") {
    return NextResponse.json({ success: false, error: "IP de impresora requerida" }, { status: 400 });
  }

  if (!isPrivateIP(ip)) {
    return NextResponse.json(
      { success: false, error: "Solo se permiten IPs de red local (192.168.x.x, 10.x.x.x, etc.)" },
      { status: 400 }
    );
  }

  if (typeof port !== "number" || port < 1 || port > 65535) {
    return NextResponse.json({ success: false, error: "Puerto inválido" }, { status: 400 });
  }

  if (!data || typeof data !== "string") {
    return NextResponse.json({ success: false, error: "Datos de impresión requeridos" }, { status: 400 });
  }

  // Decodificar base64
  let bytes: Buffer;
  try {
    bytes = Buffer.from(data, "base64");
  } catch {
    return NextResponse.json({ success: false, error: "Datos base64 inválidos" }, { status: 400 });
  }

  if (bytes.length === 0) {
    return NextResponse.json({ success: false, error: "Los datos están vacíos" }, { status: 400 });
  }

  if (bytes.length > MAX_DATA_SIZE) {
    return NextResponse.json(
      { success: false, error: `Datos demasiado grandes (máx ${MAX_DATA_SIZE / 1024}KB)` },
      { status: 400 }
    );
  }

  // Enviar por TCP a la impresora
  return await sendToPrinter(bytes, ip, port);
}

function sendToPrinter(
  bytes: Buffer,
  ip: string,
  port: number
): Promise<NextResponse> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responded = false;

    const done = (response: NextResponse) => {
      if (!responded) {
        responded = true;
        socket.destroy();
        resolve(response);
      }
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);

    socket.connect(port, ip, () => {
      socket.write(bytes, (writeErr) => {
        if (writeErr) {
          done(NextResponse.json(
            { success: false, error: `Error al escribir: ${writeErr.message}` },
            { status: 502 }
          ));
        } else {
          // Dar 200ms para que la impresora procese antes de cerrar
          setTimeout(() => {
            done(NextResponse.json({ success: true, message: "Datos enviados a la impresora" }));
          }, 200);
        }
      });
    });

    socket.on("timeout", () => {
      done(NextResponse.json(
        { success: false, error: `Timeout: la impresora en ${ip}:${port} no responde` },
        { status: 408 }
      ));
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      let message = `No se pudo conectar a ${ip}:${port}`;
      if (err.code === "ECONNREFUSED") message = `La impresora rechazó la conexión. Verifica que esté encendida y en red.`;
      if (err.code === "EHOSTUNREACH")  message = `La impresora no es accesible. Verifica la IP.`;
      if (err.code === "ETIMEDOUT")     message = `Timeout conectando a la impresora.`;

      done(NextResponse.json({ success: false, error: message }, { status: 503 }));
    });
  });
}

/**
 * Verifica que la IP sea de red privada.
 * Acepta: 192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

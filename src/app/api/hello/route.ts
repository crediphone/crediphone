import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API de CREDIPHONE funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}

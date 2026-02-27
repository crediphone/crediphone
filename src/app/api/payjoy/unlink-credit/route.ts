/**
 * FASE 20: Unlink Credit Endpoint
 * POST /api/payjoy/unlink-credit
 *
 * Desvincula un crédito de CREDIPHONE de su orden de financiamiento en Payjoy
 */

import { NextRequest, NextResponse } from "next/server";
import { unlinkCreditFromPayjoy } from "@/lib/db/payjoy";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.creditoId) {
            return NextResponse.json(
                { error: "Campo requerido: creditoId" },
                { status: 400 }
            );
        }

        await unlinkCreditFromPayjoy(body.creditoId);

        return NextResponse.json({
            success: true,
            message: "Crédito desvinculado de Payjoy exitosamente",
        });
    } catch (error) {
        console.error("[Payjoy] Error unlinking credit:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}

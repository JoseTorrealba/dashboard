import { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface VentaPorHora extends RowDataPacket {
  hora: number;
  cantidad_transacciones: number;
  total_ventas: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fecha = searchParams.get("fecha");
  const tienda = searchParams.get("tienda") || "vicuna";

  if (!fecha) {
    return new Response(JSON.stringify({ error: "Fecha es requerida" }), { status: 400 });
  }

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }

  try {
    const [rows] = await pool.query<VentaPorHora[]>('CALL ventas_por_hora_orquidea(?)', [fecha]);
    // El resultado de un CALL es un array de arrays, el primero es el result set
    return new Response(JSON.stringify(rows[0]), { status: 200 });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
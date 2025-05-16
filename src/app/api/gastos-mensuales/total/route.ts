import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tienda = searchParams.get("tienda");
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");
  if (!tienda || !anio || !mes) {
    return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    const [rows] = await pool.query(
      `CALL get_gasto_total_mensual(?, ?, ?)`,
      [tienda, anio, mes]
    );
    let total_gasto = 0;
    if (Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0]) && rows[0].length > 0) {
      total_gasto = rows[0][0]?.total_gasto || 0;
    }
    return new Response(JSON.stringify({ total_gasto }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al consultar gastos" }), { status: 500 });
  }
} 
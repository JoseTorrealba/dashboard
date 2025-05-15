import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fechaInicio = searchParams.get("fechaInicio");
  const fechaFin = searchParams.get("fechaFin");
  const tienda = searchParams.get("tienda") || "vicuna";
  if (!fechaInicio || !fechaFin) {
    return new Response(JSON.stringify({ error: "Fechas requeridas" }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    const [rows] = await pool.execute(
      "CALL get_ventas_productos_manuales(?, ?)",
      [fechaInicio, fechaFin]
    );
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
    return new Response(JSON.stringify(result), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Error al consultar ventas manuales" }), { status: 500 });
  }
} 
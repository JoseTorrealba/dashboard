import { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface VentasAcumuladasComparadas extends RowDataPacket {
  fecha: string;
  acumulado_anterior: number;
  acumulado_actual: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");
  const tienda = searchParams.get("tienda") || "vicuna";

  if (!anio || !mes) {
    return new Response(JSON.stringify({ error: "Año y mes son requeridos" }), { status: 400 });
  }

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }

  try {
    const [rows] = await pool.query<VentasAcumuladasComparadas[]>(
      'CALL get_ventas_acumuladas_comparadas(?, ?)',
      [anio, mes]
    );
    const resultado = (rows[0] as unknown as VentasAcumuladasComparadas[]) || [];
    return new Response(JSON.stringify(resultado), { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error en ventas-acumuladas-comparadas:", error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
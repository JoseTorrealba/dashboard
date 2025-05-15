import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");
  const tienda = searchParams.get("tienda") || "vicuna";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);

  if (!anio || !mes) {
    return new Response(JSON.stringify({ error: "Año y mes son requeridos" }), { status: 400 });
  }

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }

  try {
    // Ejecuta el procedimiento almacenado y espera a que termine
    await pool.query('CALL get_margen_contribucion_mensual(?, ?)', [anio, mes]);
    // Consulta paginada
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT anio, mes, cod_art, nombre_producto, descripcion_larga, margen_total
       FROM margen_contribucion_mensual
       WHERE anio = ? AND mes = ?
       ORDER BY margen_total DESC
       LIMIT ? OFFSET ?`,
      [anio, mes, pageSize, offset]
    );

    // Total de registros para paginación
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM margen_contribucion_mensual WHERE anio = ? AND mes = ?`,
      [anio, mes]
    );
    let total = 0;
    if (Array.isArray(countResult) && countResult.length > 0 && (countResult[0] as RowDataPacket).total !== undefined) {
      total = (countResult[0] as RowDataPacket).total;
    }

    // Suma total de margen_contribucion
    const [sumResult] = await pool.query(
      `SELECT ROUND(SUM(margen_total), 2) as margen_contribucion_total FROM margen_contribucion_mensual WHERE anio = ? AND mes = ?`,
      [anio, mes]
    );
    let margen_contribucion_total = 0;
    if (Array.isArray(sumResult) && sumResult.length > 0 && (sumResult[0] as RowDataPacket).margen_contribucion_total !== undefined) {
      margen_contribucion_total = (sumResult[0] as RowDataPacket).margen_contribucion_total;
    }

    return new Response(JSON.stringify({ rows, total, margen_contribucion_total }), { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error en margen-contribucion-mensual:", error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tienda = searchParams.get("tienda") || "vicuna";

  if (!code) {
    return new Response(JSON.stringify({ error: "El código es requerido" }), { status: 400 });
  }

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }

  const sql = `CALL get_producto_por_codigo(?)`;
  try {
    const [rows] = await pool.execute<RowDataPacket[][]>(sql, [code]);

    // eslint-disable-next-line no-console
    console.log('Resultado SQL para', code, ':', rows);
    // El resultado de un CALL suele venir como un array de arrays
    const raw = Array.isArray(rows) && rows.length > 0 ? rows[0][0] : null;
    const result = raw ? [{
      cod_art: raw.COD_ART,
      descripcion: raw.descripcion,
      precio_ant1: raw.PRECIO_ANT1,
      precio1: raw.PRECIO1,
      precio_ant2: raw.PRECIO_ANT2,
      precio2: raw.PRECIO2,
      precio_ant3: raw.PRECIO_ANT3,
      precio3: raw.PRECIO3,
      margen_ant1: raw.MARGEN_ANT1,
      margen1: raw.MARGEN1,
      impprecio_ant1: raw.IMPPRECIO_ANT1,
      impprecio1: raw.IMPPRECIO1,
      impprecio_ant2: raw.IMPPRECIO_ANT2,
      impprecio2: raw.IMPPRECIO2,
      fecha_act_ant: raw.FECHA_ACT_ANT,
      fecha_act: raw.FECHA_ACT
    }] : [];
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener producto por código o código de barra:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
} 
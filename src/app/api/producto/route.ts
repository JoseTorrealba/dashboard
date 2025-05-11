import { NextRequest } from "next/server";
import { pools } from "@/lib/db";

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

  const sql = `
    SELECT 
      p.cod_art, 
      p.descripcion, 
      p.preciobruto, 
      pr.impprecio1
    FROM 
      productos p
    LEFT JOIN 
      codigosdebarra cb ON p.cod_art = cb.cod_art
    JOIN 
      precios pr ON p.cod_art = pr.cod_art
    WHERE 
      p.cod_art = ?
      OR TRIM(LEADING '0' FROM cb.cod_barra) = TRIM(LEADING '0' FROM ?)
  `;

  try {
    const [rows] = await pool.execute(sql, [code, code]);
    // eslint-disable-next-line no-console
    console.log('Resultado SQL para', code, ':', rows);
    return new Response(JSON.stringify(Array.isArray(rows) ? rows : []), { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener producto por código o código de barra:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
} 
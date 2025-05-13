import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const body = await request.json();
  logger.info({ body }, 'Datos recibidos en POST /api/precios-proveedor');
  const { cod_art, cod_barra, proveedor, precio, usuario, observaciones, tienda = 'vicuna' } = body;
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    logger.error('Tienda no válida');
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    await pool.execute(
      'CALL insertar_precio_proveedor(?, ?, ?, ?, ?)',
      [cod_art, proveedor, precio, usuario, observaciones]
    );
    logger.info('Registro insertado correctamente');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    logger.error({ error }, 'Error al insertar precio de proveedor');
    return new Response(JSON.stringify({ error: 'Error al insertar precio de proveedor' }), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cod_art = searchParams.get("cod_art");
  const tienda = searchParams.get("tienda") || "vicuna";
  logger.info({ cod_art, tienda }, 'Consulta GET /api/precios-proveedor');
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    logger.error('Tienda no válida');
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  if (!cod_art) {
    logger.error('cod_art es requerido');
    return new Response(JSON.stringify({ error: "cod_art es requerido" }), { status: 400 });
  }
  try {
    const [rows] = await pool.execute('CALL consultar_precios_proveedor(?)', [cod_art]);
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
    logger.info({ result }, 'Resultado de consulta precios proveedor');
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    logger.error({ error }, 'Error al consultar precios de proveedor');
    return new Response(JSON.stringify({ error: 'Error al consultar precios de proveedor' }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  const tienda = url.searchParams.get('tienda') || 'vicuna';
  logger.info({ id, tienda }, 'Intento de eliminar precio proveedor');
  if (!id || isNaN(Number(id))) {
    logger.error({ id }, 'ID inválido en DELETE /api/precios-proveedor');
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    logger.error('Tienda no válida en DELETE /api/precios-proveedor');
    return new Response(JSON.stringify({ error: 'Tienda no válida' }), { status: 400 });
  }
  try {
    logger.info({ id, tienda }, 'Llamando a CALL eliminar_precio_proveedor');
    const [result] = await pool.execute('CALL eliminar_precio_proveedor(?)', [id]);
    logger.info({ id, tienda, result }, 'Resultado de CALL eliminar_precio_proveedor');
    logger.info({ id, tienda }, 'Registro eliminado correctamente');
    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error({ error, id, tienda }, 'Error al eliminar precio de proveedor');
    return new Response(JSON.stringify({ error: 'Error al eliminar' }), { status: 500 });
  }
} 
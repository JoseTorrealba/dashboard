import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import logger from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: any) {
  const { id } = context.params;
  const url = new URL(request.url);
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
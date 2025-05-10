import type { NextRequest } from 'next/server';
import { pools } from '@/lib/db';

type CountResult = { total: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anio = searchParams.get('anio');
  const mes = searchParams.get('mes');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const tienda = searchParams.get('tienda') || 'vicuna';

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: 'Tienda no válida' }), { status: 400 });
  }

  if (!anio || !mes) {
    return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
  }

  try {
    // 1. Verificar si ya existen registros para ese año/mes
    const [existe] = await pool.query(
      `SELECT COUNT(*) as total FROM abc_resultados_mensuales WHERE anio = ? AND mes = ?`,
      [anio, mes]
    );
    const yaExiste = Array.isArray(existe) ? (existe[0] as CountResult).total > 0 : false;

    // 2. Si no existen, ejecuta el procedimiento
    if (!yaExiste) {
      await pool.query('CALL get_abc_productos_mensual_guardado(?, ?)', [anio, mes]);
      // Verifica de nuevo si hay datos
      const [verifica] = await pool.query(
        `SELECT COUNT(*) as total FROM abc_resultados_mensuales WHERE anio = ? AND mes = ?`,
        [anio, mes]
      );
      const hayDatos = Array.isArray(verifica) ? (verifica[0] as CountResult).total > 0 : false;
      if (!hayDatos) {
        return new Response(JSON.stringify({ error: 'No se generaron datos para ese año/mes.' }), { status: 404 });
      }
    }

    // 3. Consultar los resultados paginados (sin descripcion_larga)
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT clasificacion_abc, nombre_producto, total_ingresos, porcentaje_individual, porcentaje_acumulado, anio, mes, cod_art
       FROM abc_resultados_mensuales
       WHERE anio = ? AND mes = ?
       ORDER BY clasificacion_abc, total_ingresos DESC
       LIMIT ? OFFSET ?`,
      [anio, mes, pageSize, offset]
    );

    // Obtener el total de registros para paginación
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM abc_resultados_mensuales WHERE anio = ? AND mes = ?`,
      [anio, mes]
    );
    const total = Array.isArray(countResult) ? (countResult[0] as CountResult).total : 0;

    return new Response(JSON.stringify({ rows, total }), { status: 200 });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
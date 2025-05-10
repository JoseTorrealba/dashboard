import type { NextRequest } from 'next/server';
import { pools } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get('fecha');
  const tienda = searchParams.get('tienda') || 'vicuna';
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];

  if (!fecha) {
    return new Response(JSON.stringify({ error: 'Falta la fecha' }), { status: 400 });
  }
  if (!pool) {
    return new Response(JSON.stringify({ error: 'Tienda no válida' }), { status: 400 });
  }

  try {
    // Cambia el nombre del procedimiento si es necesario para cada tienda
    const [rows] = await pool.query('CALL ventas_por_hora_orquidea(?)', [fecha]);
    // El resultado de un CALL es un array de arrays, el primero es el result set
    return new Response(JSON.stringify(rows[0]), { status: 200 });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
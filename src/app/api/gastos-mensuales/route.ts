import type { NextRequest } from "next/server";
import { pools } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tienda = searchParams.get("tienda");
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");
  const isTotal = request.nextUrl.pathname.endsWith("/total");
  if (!tienda || !anio || !mes) {
    return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    if (isTotal) {
      const [rows] = await pool.query(
        `CALL get_gasto_total_mensual(?, ?, ?)`,
        [tienda, anio, mes]
      );
      let total_gasto = 0;
      if (Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0]) && rows[0].length > 0) {
        total_gasto = rows[0][0]?.total_gasto || 0;
      }
      return new Response(JSON.stringify({ total_gasto }), { status: 200 });
    }
    const [rows] = await pool.query(
      `CALL get_gastos_mensuales(?, ?, ?)`,
      [tienda, anio, mes]
    );
    // El resultado de CALL es un array de arrays, el primero es el result set
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al consultar gastos" }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tienda, anio, mes, concepto, monto, usuario, tipo_gasto, persona } = body;
  if (!tienda || !anio || !mes || !concepto || monto == null) {
    return new Response(JSON.stringify({ error: "Faltan datos obligatorios" }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    await pool.query(
      `CALL upsert_gasto_mensual(?, ?, ?, ?, ?, ?, ?, ?)`,
      [tienda, anio, mes, concepto, monto, usuario || null, tipo_gasto || null, persona || null]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al guardar gasto" }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const tienda = searchParams.get("tienda") || "vicuna";
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });
  }
  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }
  try {
    await pool.query(`CALL delete_gasto_mensual(?)`, [id]);
    return new Response(JSON.stringify({ deleted: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al eliminar gasto" }), { status: 500 });
  }
} 
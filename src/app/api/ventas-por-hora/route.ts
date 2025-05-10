import { NextRequest } from "next/server";
import { pools } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface VentaPorHora extends RowDataPacket {
  hora: number;
  cantidad_transacciones: number;
  total_ventas: number;
}

// Interfaz simple para la respuesta al frontend
interface VentaPorHoraResponse {
  hora: number;
  cantidad_transacciones: number;
  total_ventas: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fecha = searchParams.get("fecha");
  const tienda = searchParams.get("tienda") || "vicuna";

  if (!fecha) {
    return new Response(JSON.stringify({ error: "Fecha es requerida" }), { status: 400 });
  }

  const pool = pools[tienda as 'vicuna' | 'irarrazaval'];
  if (!pool) {
    return new Response(JSON.stringify({ error: "Tienda no válida" }), { status: 400 });
  }

  try {
    const [rows] = await pool.query<VentaPorHora[]>('CALL ventas_por_hora_orquidea(?)', [fecha]);
    const ventasPorHora = (rows[0] as unknown as VentaPorHora[]) || [];
    // Generar array de 24 horas, rellenando con ceros donde no hay datos
    const resultado: VentaPorHoraResponse[] = Array.from({ length: 24 }, (_, h) => {
      const encontrado = ventasPorHora.find(v => v.hora === h);
      return encontrado
        ? {
            hora: encontrado.hora,
            cantidad_transacciones: encontrado.cantidad_transacciones,
            total_ventas: encontrado.total_ventas,
          }
        : { hora: h, cantidad_transacciones: 0, total_ventas: 0 };
    });
    return new Response(JSON.stringify(resultado), { status: 200 });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 
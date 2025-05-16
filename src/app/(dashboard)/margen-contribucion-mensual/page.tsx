"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";

interface MargenContribucionRow {
  anio: number;
  mes: number;
  cod_art: string;
  nombre_producto: string;
  descripcion_larga: string;
  margen_total: number;
}

export default function MargenContribucionMensualPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [tienda, setTienda] = useState("vicuna");
  const [data, setData] = useState<MargenContribucionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [margenTotal, setMargenTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // Leer gastos desde variable de entorno
  const gastosPorTienda = typeof process !== "undefined" && process.env.NEXT_PUBLIC_GASTOS_TIENDAS_JSON
    ? JSON.parse(process.env.NEXT_PUBLIC_GASTOS_TIENDAS_JSON)
    : {};

  const gasto = gastosPorTienda[tienda]?.[anio]?.[mes] ?? 0;

  const consultar = async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/margen-contribucion-mensual?anio=${anio}&mes=${mes}&tienda=${tienda}&page=${p}&pageSize=${pageSize}`);
    const json = await res.json();
    setData(Array.isArray(json.rows) ? json.rows : []);
    setTotal(json.total || 0);
    setMargenTotal(json.margen_contribucion_total || 0);
    setLoading(false);
    setPage(p);
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-2">Monthly Contribution Margin <span className="text-slate-400 font-normal">(MCM)</span></h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 items-stretch sm:items-end w-full">
        <select className="border rounded px-2 py-1 w-full sm:w-auto" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <select className="border rounded px-2 py-1 w-full sm:w-auto" value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="border rounded px-2 py-1 w-full sm:w-auto" value={mes} onChange={e => setMes(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>)}
        </select>
        <Button onClick={() => consultar(1)} disabled={loading} className="w-full sm:w-auto">
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
      <div className="mb-2">
        <span className="text-lg font-semibold">Gasto tienda: </span>
        <span className="text-2xl font-bold text-red-700">{Number(gasto).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="mb-4">
        <span className="text-lg font-semibold">Total MCM: </span>
        <span className="text-2xl font-bold text-green-700">{Number(margenTotal).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-2 py-1 border whitespace-nowrap">Año</th>
              <th className="px-2 py-1 border whitespace-nowrap">Mes</th>
              <th className="px-2 py-1 border whitespace-nowrap">Cod Art</th>
              <th className="px-2 py-1 border whitespace-nowrap">Nombre Producto</th>
              <th className="px-2 py-1 border whitespace-nowrap">Margen Total</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Sin resultados</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.anio}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.mes.toString().padStart(2, "0")}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.cod_art}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.nombre_producto}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{Number(row.margen_total).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 my-4 items-center">
        <Button onClick={() => consultar(page - 1)} disabled={page === 1 || loading}>Anterior</Button>
        <span>Página {page} de {Math.ceil(total / pageSize)}</span>
        <Button onClick={() => consultar(page + 1)} disabled={page * pageSize >= total || loading}>Siguiente</Button>
      </div>
    </Container>
  );
} 
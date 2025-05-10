"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";

interface ProductoABC {
  anio: number;
  mes: number;
  cod_art: string;
  nombre_producto: string;
  total_ingresos: number;
  porcentaje_individual: number;
  porcentaje_acumulado: number;
  clasificacion_abc: string;
}

export default function ConsultaABC() {
  const [anio, setAnio] = useState(2025);
  const [mes, setMes] = useState(4);
  const [tienda, setTienda] = useState('vicuna');
  const [data, setData] = useState<ProductoABC[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const consultar = async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/abc-productos?anio=${anio}&mes=${mes}&tienda=${tienda}&page=${p}&pageSize=${pageSize}`);
    const json = await res.json();
    setData(Array.isArray(json.rows) ? json.rows : []);
    setTotal(json.total || 0);
    setLoading(false);
    setPage(p);
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Pareto ABC 60/25/15 SUPERMERCADO ORQUIDEA</h1>
      <div className="flex gap-4 mb-6">
        <select className="border rounded px-2 py-1" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <select className="border rounded px-2 py-1" value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="border rounded px-2 py-1" value={mes} onChange={e => setMes(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Button onClick={() => consultar(1)} disabled={loading}>
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Año</th>
              <th className="px-4 py-2">Mes</th>
              <th className="px-4 py-2">Cod Art</th>
              <th className="px-4 py-2">Nombre Producto</th>
              <th className="px-4 py-2">Total Ingresos</th>
              <th className="px-4 py-2">% Individual</th>
              <th className="px-4 py-2">% Acumulado</th>
              <th className="px-4 py-2">Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{row.anio}</td>
                <td className="px-4 py-2">{row.mes}</td>
                <td className="px-4 py-2">{row.cod_art}</td>
                <td className="px-4 py-2">{row.nombre_producto}</td>
                <td className="px-4 py-2">{row.total_ingresos}</td>
                <td className="px-4 py-2">{row.porcentaje_individual}</td>
                <td className="px-4 py-2">{row.porcentaje_acumulado}</td>
                <td className="px-4 py-2">{row.clasificacion_abc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => consultar(page - 1)} disabled={page === 1 || loading}>Anterior</Button>
        <span>Página {page} de {Math.ceil(total / pageSize)}</span>
        <Button onClick={() => consultar(page + 1)} disabled={page * pageSize >= total || loading}>Siguiente</Button>
      </div>
    </Container>
  );
} 
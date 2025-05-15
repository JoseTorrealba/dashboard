"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";

interface VentaManual {
  TIPO: string;
  NUMERO: string;
  DESCRIPCION: string;
  FECHA: string;
  "PRECIO UNITARIO": number;
  CANTIDAD: number;
  "TOTAL NETO": number;
  "TOTAL BRUTO": number;
}

export default function VentasManualesPage() {
  const [tienda, setTienda] = useState("vicuna");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [ventas, setVentas] = useState<VentaManual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const pageSize = 30;
  const totalPaginas = Math.ceil(ventas.length / pageSize);
  const ventasPagina = ventas.slice((pagina - 1) * pageSize, pagina * pageSize);

  const consultar = async () => {
    setLoading(true);
    setError("");
    setVentas([]);
    try {
      const res = await fetch(`/api/ventas-manuales?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&tienda=${tienda}`);
      const data = await res.json();
      if (res.ok) {
        setVentas(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || "Error al consultar ventas manuales");
      }
    } catch {
      setError("Error al consultar ventas manuales");
    }
    setLoading(false);
  };

  // Diccionario de equivalencias para productos frecuentes
  const equivalencias: Record<string, string[]> = {
    pan: ["pan", "pna", "pan.", "pán", "pãn", "marraqueta", "psn", "pam"],
    chuleta: ["chuleta", "chulet", "chuleta."],
    queso: ["queso", "ques", "qso"],
    jamon: ["jamon", "jamón", "jmn"],
    salame: ["salame", "salami"],
    zanahoria: ["zanahoria", "zanahorias"],
    // ...agrega más productos y variantes según tus datos
  };

  // Función para parsear números correctamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseNumber(str: any) {
    if (typeof str === "number") return str;
    if (typeof str !== "string") return 0;
    return Number(str.replace(/\./g, "").replace(",", "."));
  }

  function normalizarDescripcion(desc: string) {
    const d = desc
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    for (const [canonico, variantes] of Object.entries(equivalencias)) {
      if (variantes.includes(d)) return canonico;
    }
    return d || desc || "desconocido";
  }

  const resumen = ventas.reduce((acc, venta) => {
    const key = normalizarDescripcion(venta.DESCRIPCION);
    if (!acc[key]) {
      acc[key] = {
        DESCRIPCION: key,
        cantidad: 0,
        totalNeto: 0,
        totalBruto: 0,
      };
    }
    const neto = parseNumber(venta["TOTAL NETO"]);
    const bruto = parseNumber(venta["TOTAL BRUTO"]);
    acc[key].cantidad += Number(venta.CANTIDAD) || 0;
    acc[key].totalNeto += neto;
    acc[key].totalBruto += bruto;
    // Log para depuración
    // eslint-disable-next-line no-console
    console.log(`Producto: ${key}`, { neto, bruto, desc: venta.DESCRIPCION });
    return acc;
  }, {} as Record<string, { DESCRIPCION: string; cantidad: number; totalNeto: number; totalBruto: number; __debug?: any[] }>); // eslint-disable-line @typescript-eslint/no-explicit-any
  Object.entries(resumen).forEach(([k, v]) => {
    // eslint-disable-next-line no-console
    console.log(`Producto: ${k}`, v.__debug);
  });
  const resumenArray = Object.values(resumen).filter(r => r.totalNeto > 0 || r.totalBruto > 0);

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Ventas manuales</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 items-stretch sm:items-end w-full">
        <select className="border rounded px-2 py-1 w-full sm:w-auto" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <input type="date" className="border rounded px-2 py-1 w-full sm:w-auto" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1 w-full sm:w-auto" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        <Button onClick={consultar} disabled={loading || !fechaInicio || !fechaFin} className="w-full sm:w-auto">
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {ventas.length > 0 && (
        <div className="flex gap-2 my-4 items-center">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="px-2 py-1 border rounded disabled:opacity-50">Anterior</button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="px-2 py-1 border rounded disabled:opacity-50">Siguiente</button>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-2 py-1 border whitespace-nowrap">DESCRIPCION</th>
              <th className="px-2 py-1 border whitespace-nowrap">CANTIDAD</th>
              <th className="px-2 py-1 border whitespace-nowrap">TOTAL NETO</th>
              <th className="px-2 py-1 border whitespace-nowrap">TOTAL BRUTO</th>
            </tr>
          </thead>
          <tbody>
            {ventasPagina.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4">Sin resultados</td>
              </tr>
            ) : (
              ventasPagina.map((v, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 whitespace-nowrap">{v.DESCRIPCION}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{v.CANTIDAD}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{v["TOTAL NETO"].toLocaleString("es-CL")}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{v["TOTAL BRUTO"].toLocaleString("es-CL")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Tabla de resumen */}
      {ventas.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-2">Resumen por producto (agrupado)</h2>
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-1 border whitespace-nowrap">Producto</th>
                  <th className="px-2 py-1 border whitespace-nowrap">Cantidad total</th>
                  <th className="px-2 py-1 border whitespace-nowrap">Total Neto</th>
                  <th className="px-2 py-1 border whitespace-nowrap">Total Bruto</th>
                </tr>
              </thead>
              <tbody>
                {resumenArray.map((r, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 whitespace-nowrap">{r.DESCRIPCION}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{r.cantidad}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{!isNaN(r.totalNeto) ? r.totalNeto.toLocaleString("es-CL") : 0}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{!isNaN(r.totalBruto) ? r.totalBruto.toLocaleString("es-CL") : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
} 
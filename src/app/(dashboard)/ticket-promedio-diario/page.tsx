"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
import { VChart } from "@visactor/react-vchart";

interface TicketPromedioDiario {
  fecha: string;
  cantidad_tickets: number;
  total_ventas: number;
  ticket_promedio: number;
}

interface VentasAcumuladasComparadas {
  fecha: string;
  acumulado_anterior: number;
  acumulado_actual: number;
}

function getYearMonth(monthStr: string) {
  // monthStr es '2025-05' (de <input type="month" />)
  const [anio, mes] = monthStr.split("-").map(Number);
  return { anio, mes };
}

export default function TicketPromedioDiarioPage() {
  const today = new Date();
  const defaultMonth = today.toISOString().slice(0, 7); // yyyy-mm
  const [tienda, setTienda] = useState("vicuna");
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<TicketPromedioDiario[]>([]);
  const [ventasAcumuladas, setVentasAcumuladas] = useState<VentasAcumuladasComparadas[]>([]);
  const [loading, setLoading] = useState(false);

  const consultar = async () => {
    setLoading(true);
    const { anio, mes } = getYearMonth(month);
    const res = await fetch(`/api/ticket-promedio-diario?anio=${anio}&mes=${mes}&tienda=${tienda}`);
    const json = await res.json();
    setData(Array.isArray(json) ? json : []);

    // Fetch ventas acumuladas comparadas
    const resAcum = await fetch(`/api/ventas-acumuladas-comparadas?anio=${anio}&mes=${mes}&tienda=${tienda}`);
    const jsonAcum = await resAcum.json();
    setVentasAcumuladas(Array.isArray(jsonAcum) ? jsonAcum : []);
    setLoading(false);
  };

  // Prepara los datos para el gráfico
  const chartData = data.map(d => ({
    fecha: d.fecha.slice(8, 10), // solo día
    ticket_promedio: d.ticket_promedio,
    total_ventas: d.total_ventas,
    cantidad_tickets: d.cantidad_tickets,
  }));

  // Mapeo de nombre legible de sucursal
  const sucursalNombre = tienda === "vicuna" ? "Vicuña Mackenna" : "Irarrázaval";

  // Gráfico 1: Ticket promedio diario (barra)
  const chartSpecTicketPromedio = {
    type: "bar",
    data: [
      {
        id: "ticketPromedioDiario",
        values: chartData,
      },
    ],
    series: [
      {
        type: "bar",
        xField: "fecha",
        yField: "ticket_promedio",
        bar: { style: { fill: "#2563eb", cornerRadius: [8, 8, 8, 8] }, width: 16, gap: 4 },
        name: "Ticket promedio",
        label: { visible: false },
      },
    ],
    axes: [
      { orient: "bottom", type: "band" as const, field: "fecha", title: { text: `Día del mes (${sucursalNombre})`, visible: true } },
      { orient: "left", type: "linear" as const, field: "ticket_promedio", title: { text: "Ticket promedio ($)", visible: true } },
    ],
    legends: { visible: false },
    tooltip: { trigger: ["hover"] as ("hover" | "click")[] },
    padding: [10, 0, 10, 0],
  };

  // Gráfico 2: Cantidad de tickets diarios (barra)
  const chartSpecCantidadTickets = {
    type: "bar",
    data: [
      {
        id: "cantidadTicketsDiario",
        values: chartData,
      },
    ],
    series: [
      {
        type: "bar",
        xField: "fecha",
        yField: "cantidad_tickets",
        bar: { style: { fill: "#fbbf24", cornerRadius: [8, 8, 8, 8] }, width: 16, gap: 4 },
        name: "Cantidad tickets",
        label: { visible: false },
      },
    ],
    axes: [
      { orient: "bottom", type: "band" as const, field: "fecha", title: { text: `Día del mes (${sucursalNombre})`, visible: true } },
      { orient: "left", type: "linear" as const, field: "cantidad_tickets", title: { text: "Cantidad tickets", visible: true } },
    ],
    legends: { visible: false },
    tooltip: { trigger: ["hover"] as ("hover" | "click")[] },
    padding: [10, 0, 10, 0],
  };

  // Gráfico 3: Total ventas diario (barra)
  const chartSpecTotalVentas = {
    type: "bar",
    data: [
      {
        id: "totalVentasDiario",
        values: chartData,
      },
    ],
    series: [
      {
        type: "bar",
        xField: "fecha",
        yField: "total_ventas",
        bar: { style: { fill: "#38bdf8", cornerRadius: [8, 8, 8, 8] }, width: 16, gap: 4 },
        name: "Total ventas",
        label: { visible: false },
      },
    ],
    axes: [
      { orient: "bottom", type: "band" as const, field: "fecha", title: { text: `Día del mes (${sucursalNombre})`, visible: true } },
      { orient: "left", type: "linear" as const, field: "total_ventas", title: { text: "Total ventas ($)", visible: true } },
    ],
    legends: { visible: false },
    tooltip: { trigger: ["hover"] as ("hover" | "click")[] },
    padding: [10, 0, 10, 0],
  };

  // Gráfico 4: Ventas acumuladas comparadas (línea)
  const chartSpecVentasAcumuladas = {
    type: "line",
    data: [
      {
        id: "ventasAcumuladasComparadas",
        values: ventasAcumuladas.map(d => ({
          fecha: d.fecha.slice(8, 10),
          acumulado_anterior: d.acumulado_anterior,
          acumulado_actual: d.acumulado_actual,
        })),
      },
    ],
    series: [
      {
        type: "line",
        xField: "fecha",
        yField: "acumulado_anterior",
        line: { style: { stroke: "#fbbf24", lineWidth: 3 } },
        point: { style: { fill: "#fbbf24", size: 6 } },
        name: "Mes anterior",
      },
      {
        type: "line",
        xField: "fecha",
        yField: "acumulado_actual",
        line: { style: { stroke: "#2563eb", lineWidth: 3 } },
        point: { style: { fill: "#2563eb", size: 6 } },
        name: "Mes actual",
      },
    ],
    axes: [
      { orient: "bottom", type: "band" as const, field: "fecha", title: { text: `Día del mes (${sucursalNombre})`, visible: true } },
      { orient: "left", type: "linear" as const, field: "acumulado_actual", title: { text: "Ventas acumuladas ($)", visible: true } },
    ],
    legends: { visible: true },
    tooltip: { trigger: ["hover"] as ("hover" | "click")[] },
    padding: [10, 0, 10, 0],
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Ticket promedio diario del mes</h1>
      <div className="flex gap-4 mb-6">
        <select className="border rounded px-2 py-1" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <input
          type="month"
          className="border rounded px-2 py-1"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
        <Button onClick={consultar} disabled={loading || !month}>
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
      <div className="bg-white rounded shadow p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Ticket promedio diario</h2>
        {data.length > 0 ? (
          <VChart spec={chartSpecTicketPromedio} style={{ height: 300 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos para el mes seleccionado.</div>
        )}
      </div>
      <div className="bg-white rounded shadow p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Cantidad de tickets diarios</h2>
        {data.length > 0 ? (
          <VChart spec={chartSpecCantidadTickets} style={{ height: 300 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos para el mes seleccionado.</div>
        )}
      </div>
      <div className="bg-white rounded shadow p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Total ventas diario</h2>
        {data.length > 0 ? (
          <VChart spec={chartSpecTotalVentas} style={{ height: 300 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos para el mes seleccionado.</div>
        )}
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-bold mb-4">Ventas acumuladas comparadas</h2>
        {ventasAcumuladas.length > 0 ? (
          <VChart spec={chartSpecVentasAcumuladas} style={{ height: 300 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos de ventas acumuladas para el mes seleccionado.</div>
        )}
      </div>
    </Container>
  );
} 
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
import { VChart } from "@visactor/react-vchart";

interface VentaPorHora {
  hora: number;
  cantidad_transacciones: number;
  total_ventas: number;
}

function getToday() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getPreviousWeekDate(dateStr: string) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

export default function VentasPorHora() {
  const [fecha, setFecha] = useState(getToday());
  const [tienda, setTienda] = useState("vicuna");
  const [data, setData] = useState<{ actual: VentaPorHora[]; anterior: VentaPorHora[] }>({ actual: [], anterior: [] });
  const [loading, setLoading] = useState(false);

  const consultar = async (f = fecha, t = tienda) => {
    setLoading(true);
    const prevDate = getPreviousWeekDate(f);
    const [resActual, resAnterior] = await Promise.all([
      fetch(`/api/ventas-por-hora?fecha=${f}&tienda=${t}`),
      fetch(`/api/ventas-por-hora?fecha=${prevDate}&tienda=${t}`)
    ]);
    const dataActual = await resActual.json();
    const dataAnterior = await resAnterior.json();
    setData({
      actual: Array.isArray(dataActual) ? dataActual : [],
      anterior: Array.isArray(dataAnterior) ? dataAnterior : [],
    });
    setLoading(false);
  };

  useEffect(() => {
    consultar(getToday(), "vicuna");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preparamos los datos para el gráfico
  const chartData = Array.from({ length: 24 }, (_, h) => ({
    hora: h,
    actual: data.actual.find(v => v.hora === h)?.total_ventas ?? 0,
    anterior: data.anterior.find(v => v.hora === h)?.total_ventas ?? 0,
  })).filter(d => d.actual > 0 || d.anterior > 0);

  const chartSpec = {
    type: "bar",
    data: [
      {
        id: "ventasPorHora",
        values: chartData,
      },
    ],
    series: [
      {
        type: "bar",
        xField: "hora",
        yField: "anterior",
        bar: {
          style: { fill: "#38bdf8", cornerRadius: [8, 8, 8, 8] },
        },
        label: { visible: false },
        name: "Semana anterior",
      },
      {
        type: "bar",
        xField: "hora",
        yField: "actual",
        bar: {
          style: { fill: "#2563eb", cornerRadius: [8, 8, 8, 8] },
        },
        label: { visible: false },
        name: "Fecha seleccionada",
      },
    ],
    seriesLayout: 'group',
    legends: { visible: true },
    axes: [
      { orient: "bottom", type: "band" as const, field: "hora", title: { text: "Hora del día", visible: true } },
      { orient: "left", type: "linear" as const, field: "actual", title: { text: "Total de ventas ($)", visible: true } },
    ],
    tooltip: { trigger: ["hover"] as ("hover" | "click")[] },
    padding: [10, 0, 10, 0],
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Ventas por hora</h1>
      <div className="flex gap-4 mb-6">
        <select className="border rounded px-2 py-1" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
        <Button onClick={() => consultar(fecha, tienda)} disabled={loading || !fecha}>
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
      <div className="bg-white rounded shadow p-4">
        {data.actual.length > 0 || data.anterior.length > 0 ? (
          <VChart spec={chartSpec} style={{ height: 400 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos para la fecha seleccionada.</div>
        )}
      </div>
    </Container>
  );
} 
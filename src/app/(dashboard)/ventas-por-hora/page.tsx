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

export default function VentasPorHora() {
  const [fecha, setFecha] = useState(getToday());
  const [tienda, setTienda] = useState("vicuna");
  const [data, setData] = useState<VentaPorHora[]>([]);
  const [loading, setLoading] = useState(false);

  const consultar = async (f = fecha, t = tienda) => {
    setLoading(true);
    const res = await fetch(`/api/ventas-por-hora?fecha=${f}&tienda=${t}`);
    const json = await res.json();
    setData(Array.isArray(json) ? json : []);
    setLoading(false);
  };

  useEffect(() => {
    consultar(getToday(), "vicuna");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartSpec = {
    type: "bar",
    data: [
      {
        id: "ventasPorHora",
        values: data,
      },
    ],
    xField: "hora",
    yField: "total_ventas",
    padding: [10, 0, 10, 0],
    legends: { visible: false },
    tooltip: { trigger: ["click", "hover"] },
    bar: {
      style: { cornerRadius: [8, 8, 8, 8] },
    },
    axes: [
      { orient: "bottom", type: "band", field: "hora", title: "Hora" },
      { orient: "left", type: "linear", field: "total_ventas", title: "Total Ventas" },
    ],
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
        {data.length > 0 ? (
          <VChart spec={chartSpec} style={{ height: 400 }} />
        ) : (
          <div className="text-center text-muted-foreground">No hay datos para la fecha seleccionada.</div>
        )}
      </div>
    </Container>
  );
} 
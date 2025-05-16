"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";

interface GastoMensual {
  id?: number;
  concepto: string;
  monto: number;
  tipo_gasto?: string;
  persona?: string;
}

const tiposGasto = [
  { value: "personal", label: "Personal" },
  { value: "arriendo", label: "Arriendo" },
  { value: "servicio", label: "Servicio" },
  { value: "impuesto", label: "Impuesto" },
  { value: "insumo", label: "Insumo" },
  { value: "otro", label: "Otro" },
];

export default function GastosMensualesPage() {
  const [tienda, setTienda] = useState("vicuna");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [gastos, setGastos] = useState<GastoMensual[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState(0);
  const [nuevoTipoGasto, setNuevoTipoGasto] = useState("");
  const [nuevaPersona, setNuevaPersona] = useState("");
  const [nuevoSueldo, setNuevoSueldo] = useState(0);
  const [nuevoBonoProd, setNuevoBonoProd] = useState(0);
  const [nuevasHorasExtra, setNuevasHorasExtra] = useState(0);
  const [nuevasPrevisiones, setNuevasPrevisiones] = useState(0);
  const [usuario, setUsuario] = useState(""); // opcional

  useEffect(() => {
    fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tienda, anio, mes]);

  const fetchGastos = async () => {
    setLoading(true);
    const res = await fetch(`/api/gastos-mensuales?tienda=${tienda}&anio=${anio}&mes=${mes}`);
    const data = await res.json();
    setGastos(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const agregarGasto = async () => {
    setLoading(true);
    if (nuevoTipoGasto === "personal") {
      const gastosPersonal = [
        { concepto: "Sueldo", monto: nuevoSueldo },
        { concepto: "Bono prod", monto: nuevoBonoProd },
        { concepto: "Horas extra", monto: nuevasHorasExtra },
        { concepto: "Previsiones", monto: nuevasPrevisiones },
      ];
      const promesas = gastosPersonal
        .filter(g => g.monto > 0)
        .map(g => fetch(`/api/gastos-mensuales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tienda, anio, mes, concepto: g.concepto, monto: g.monto, usuario, tipo_gasto: "personal", persona: nuevaPersona }),
        }));
      await Promise.all(promesas);
      setNuevaPersona("");
      setNuevoSueldo(0);
      setNuevoBonoProd(0);
      setNuevasHorasExtra(0);
      setNuevasPrevisiones(0);
    } else {
      if (!nuevoConcepto || nuevoMonto <= 0) {
        setLoading(false);
        return;
      }
      await fetch(`/api/gastos-mensuales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tienda, anio, mes, concepto: nuevoConcepto, monto: nuevoMonto, usuario, tipo_gasto: nuevoTipoGasto, persona: nuevaPersona }),
      });
      setNuevoConcepto("");
      setNuevoMonto(0);
    }
    setNuevoTipoGasto("");
    fetchGastos();
    setLoading(false);
  };

  const actualizarGasto = async (id: number, concepto: string, monto: number, tipo_gasto?: string, persona?: string) => {
    setLoading(true);
    await fetch(`/api/gastos-mensuales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tienda, anio, mes, concepto, monto, usuario, tipo_gasto, persona }),
    });
    fetchGastos();
  };

  const eliminarGasto = async (id: number) => {
    setLoading(true);
    await fetch(`/api/gastos-mensuales?id=${id}&tienda=${tienda}`, { method: "DELETE" });
    fetchGastos();
  };

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Gastos mensuales por tienda</h1>
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
        <select
          className="border rounded px-2 py-1 w-full sm:w-auto"
          value={nuevoTipoGasto}
          onChange={e => setNuevoTipoGasto(e.target.value)}
        >
          <option value="">Tipo de gasto</option>
          {tiposGasto.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {nuevoTipoGasto === "personal" ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold mb-1">Nombre del trabajador</label>
              <input
                type="text"
                placeholder="Nombre del trabajador"
                title="Nombre del trabajador"
                className="border rounded px-2 py-1 w-full sm:w-auto"
                value={nuevaPersona}
                onChange={e => setNuevaPersona(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold mb-1">Sueldo base</label>
              <input
                type="number"
                placeholder="Sueldo base"
                title="Sueldo base mensual del trabajador"
                className="border rounded px-2 py-1 w-full sm:w-auto"
                value={nuevoSueldo}
                onChange={e => setNuevoSueldo(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold mb-1">Bono producción</label>
              <input
                type="number"
                placeholder="Bono producción"
                title="Bono de producción, incentivo o gratificación variable"
                className="border rounded px-2 py-1 w-full sm:w-auto"
                value={nuevoBonoProd}
                onChange={e => setNuevoBonoProd(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold mb-1">Horas extra</label>
              <input
                type="number"
                placeholder="Horas extra"
                title="Monto pagado por horas extra trabajadas ese mes"
                className="border rounded px-2 py-1 w-full sm:w-auto"
                value={nuevasHorasExtra}
                onChange={e => setNuevasHorasExtra(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold mb-1">Previsiones (AFP, salud, etc.)</label>
              <input
                type="number"
                placeholder="Previsiones (AFP, salud, etc.)"
                title="Aportes previsionales asociados a ese trabajador para ese mes"
                className="border rounded px-2 py-1 w-full sm:w-auto"
                value={nuevasPrevisiones}
                onChange={e => setNuevasPrevisiones(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Concepto"
              className="border rounded px-2 py-1 w-full sm:w-auto"
              value={nuevoConcepto}
              onChange={e => setNuevoConcepto(e.target.value)}
            />
            <input
              type="number"
              placeholder="Monto"
              className="border rounded px-2 py-1 w-full sm:w-auto"
              value={nuevoMonto}
              onChange={e => setNuevoMonto(Number(e.target.value))}
            />
          </>
        )}
        <Button
          onClick={agregarGasto}
          disabled={
            loading ||
            (nuevoTipoGasto === "personal"
              ? (!nuevaPersona || (nuevoSueldo <= 0 && nuevoBonoProd <= 0 && nuevasHorasExtra <= 0 && nuevasPrevisiones <= 0))
              : (!nuevoConcepto || nuevoMonto <= 0)
            )
          }
          className="w-full sm:w-auto"
        >
          Agregar
        </Button>
      </div>
      <div className="mb-4">
        <span className="text-lg font-semibold">Total gastos: </span>
        <span className="text-2xl font-bold text-red-700">{Number(total).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-2 py-1 border whitespace-nowrap">Tipo</th>
              <th className="px-2 py-1 border whitespace-nowrap">Persona</th>
              <th className="px-2 py-1 border whitespace-nowrap">Concepto</th>
              <th className="px-2 py-1 border whitespace-nowrap">Monto</th>
              <th className="px-2 py-1 border whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">Sin gastos</td>
              </tr>
            ) : (
              gastos.map((g, i) => (
                <tr key={g.id || i}>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <select
                      className="w-full border rounded px-1 py-0.5"
                      value={g.tipo_gasto || ""}
                      onChange={e => {
                        const newGastos = [...gastos];
                        newGastos[i].tipo_gasto = e.target.value;
                        setGastos(newGastos);
                      }}
                      onBlur={() => g.id && actualizarGasto(g.id, g.concepto, g.monto, g.tipo_gasto, g.persona)}
                    >
                      <option value="">Tipo de gasto</option>
                      {tiposGasto.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {g.tipo_gasto === "personal" ? (
                      <input
                        type="text"
                        value={g.persona || ""}
                        className="w-full border rounded px-1 py-0.5"
                        onChange={e => {
                          const newGastos = [...gastos];
                          newGastos[i].persona = e.target.value;
                          setGastos(newGastos);
                        }}
                        onBlur={() => g.id && actualizarGasto(g.id, g.concepto, g.monto, g.tipo_gasto, g.persona)}
                      />
                    ) : null}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <input
                      type="text"
                      value={g.concepto}
                      className="w-full border rounded px-1 py-0.5"
                      onChange={e => {
                        const newGastos = [...gastos];
                        newGastos[i].concepto = e.target.value;
                        setGastos(newGastos);
                      }}
                      onBlur={() => g.id && actualizarGasto(g.id, g.concepto, g.monto, g.tipo_gasto, g.persona)}
                    />
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <input
                      type="number"
                      value={g.monto}
                      className="w-full border rounded px-1 py-0.5"
                      onChange={e => {
                        const newGastos = [...gastos];
                        newGastos[i].monto = Number(e.target.value);
                        setGastos(newGastos);
                      }}
                      onBlur={() => g.id && actualizarGasto(g.id, g.concepto, g.monto, g.tipo_gasto, g.persona)}
                    />
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <Button variant="destructive" size="sm" onClick={() => g.id && eliminarGasto(g.id)} disabled={loading}>Eliminar</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
} 
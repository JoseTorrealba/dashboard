"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
// @ts-expect-error: Usamos BrowserMultiFormatReader para escanear códigos de barra
import { BrowserMultiFormatReader, IScannerControls, Result, Exception } from "@zxing/browser";

interface Producto {
  cod_art: string;
  descripcion: string;
  preciobruto: number;
  impprecio1: number;
}

export default function BuscarProductoPage() {
  const [code, setCode] = useState("");
  const [tienda, setTienda] = useState("vicuna");
  const [result, setResult] = useState<Producto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const buscar = async (codigo?: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/producto?code=${encodeURIComponent(codigo || code)}&tienda=${tienda}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setResult(null);
      } else {
        setResult(Array.isArray(json) ? json : []);
      }
    } catch (e) {
      setError("Error al buscar producto");
      setResult(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") buscar();
  };

  const startScan = async () => {
    setScanning(true);
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    if (videoRef.current) {
      codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result: Result | undefined, err: Exception | undefined, controls?: IScannerControls) => {
        if (result) {
          setCode(result.getText());
          setScanning(false);
          buscar(result.getText());
        }
      });
    }
  };

  const stopScan = () => {
    setScanning(false);
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Buscar producto</h1>
      <div className="flex gap-4 mb-6 items-center">
        <select className="border rounded px-2 py-1" value={tienda} onChange={e => setTienda(e.target.value)}>
          <option value="vicuna">Vicuña Mackenna</option>
          <option value="irarrazaval">Irarrázaval</option>
        </select>
        <input
          type="text"
          className="border rounded px-2 py-1"
          placeholder="Código o código de barra"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={() => buscar()} disabled={loading || !code}>
          {loading ? "Buscando..." : "Buscar"}
        </Button>
        <Button variant="outline" onClick={scanning ? stopScan : startScan}>
          {scanning ? "Detener escáner" : "Escanear"}
        </Button>
      </div>
      {scanning && (
        <div className="mb-4">
          <video ref={videoRef} id="video" width={320} height={240} autoPlay className="border rounded" />
        </div>
      )}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {result && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-2 border">Código</th>
                <th className="px-4 py-2 border">Descripción</th>
                <th className="px-4 py-2 border">Precio Bruto</th>
                <th className="px-4 py-2 border">Precio 1</th>
              </tr>
            </thead>
            <tbody>
              {result.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">No se encontró el producto.</td>
                </tr>
              ) : (
                result.map((p, i) => (
                  <tr key={p.cod_art + i}>
                    <td className="border px-4 py-2">{p.cod_art}</td>
                    <td className="border px-4 py-2">{p.descripcion}</td>
                    <td className="border px-4 py-2">{p.preciobruto.toLocaleString("es-CL")}</td>
                    <td className="border px-4 py-2">{p.impprecio1.toLocaleString("es-CL")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
} 
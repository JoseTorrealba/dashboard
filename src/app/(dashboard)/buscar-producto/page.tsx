"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
import type { IScannerControls } from "@zxing/browser";
import { BrowserMultiFormatReader } from "@zxing/browser";
import logger from '@/lib/logger';

interface Producto {
  cod_art: string;
  descripcion: string;
  preciobruto: number;
  impprecio1: number;
}

interface ProductoCentral {
  name: string;
  sku: string;
  price: number;
  isAvailable: boolean;
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
  const controlsRef = useRef<IScannerControls | null>(null);
  const [productosCentral, setProductosCentral] = useState<ProductoCentral[]>([]);

  const buscar = async (codigo?: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setProductosCentral([]);
    try {
      const codeToSearch = codigo || code;
      const res = await fetch(`/api/producto?code=${encodeURIComponent(codeToSearch)}&tienda=${tienda}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setResult(null);
      } else {
        setResult(Array.isArray(json) ? json : []);
      }
      // Llamada a Central Mayorista usando el endpoint local
      const centralRes = await fetch(`/api/centralmayorista?code=${encodeURIComponent(codeToSearch)}`);
      const productoCentral = await centralRes.json();
      setProductosCentral(Array.isArray(productoCentral) ? productoCentral : []);
    } catch {
      setError("Error al buscar producto");
      setResult(null);
      setProductosCentral([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") buscar();
  };

  const startScan = () => {
    setScanning(true);
    setError("");
  };

  useEffect(() => {
    if (scanning && videoRef.current) {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      logger.info('Intentando acceder a la cámara para escanear (plataforma: ' + navigator.userAgent + ')');
      codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err, controls) => {
          controlsRef.current = controls || null;
          if (result) {
            setCode(result.getText());
            setScanning(false);
            buscar(result.getText());
          }
          if (err) {
            // Ignora errores de no detección de código
            if (
              err.name === 'NotFoundException' ||
              err.message?.includes('No MultiFormat Readers were able to detect the code')
            ) {
              // No hacer nada, seguir escaneando
              return;
            }
            // Solo aquí es error crítico
            logger.error({ err }, 'Error de escaneo de cámara');
            setError("No se pudo acceder a la cámara o iniciar el escáner");
            setScanning(false);
          }
        }
      ).catch((e) => {
        logger.error({ e }, 'Error al acceder a la cámara o iniciar el escáner');
        setError("No se pudo acceder a la cámara o iniciar el escáner");
        setScanning(false);
      });
    }
    if (!scanning && controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, videoRef.current]);

  const stopScan = () => {
    setScanning(false);
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
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
                {result.length > 0 && Object.keys(result[0]).map((key) => (
                  <th key={key} className="px-4 py-2 border">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.length === 0 ? (
                <tr>
                  <td colSpan={result[0] ? Object.keys(result[0]).length : 1} className="text-center py-4">No se encontró el producto.</td>
                </tr>
              ) : (
                result.map((p, i) => (
                  <tr key={i}>
                    {Object.entries(p).map(([key, value]) => (
                      <td key={key} className="border px-4 py-2">
                        {typeof value === "number"
                          ? value.toLocaleString("es-CL")
                          : value instanceof Date
                            ? value.toISOString()
                            : value != null
                              ? value.toString()
                              : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {productosCentral.length > 0 && (
        <div className="overflow-x-auto mt-8">
          <h2 className="text-xl font-bold mb-2">Llamada a centralmayorista</h2>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-2 border">Nombre</th>
                <th className="px-4 py-2 border">SKU</th>
                <th className="px-4 py-2 border">Precio</th>
                <th className="px-4 py-2 border">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {productosCentral.map((prod, idx) => (
                <tr key={prod.sku + idx}>
                  <td className="border px-4 py-2">{prod.name}</td>
                  <td className="border px-4 py-2">{prod.sku}</td>
                  <td className="border px-4 py-2">{prod.price != null ? prod.price.toLocaleString("es-CL") : ""}</td>
                  <td className="border px-4 py-2">{prod.isAvailable ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {productosCentral.length === 0 && code && !loading && (
        <div className="mt-8 text-center text-muted-foreground">No se encontró el producto en Central Mayorista.</div>
      )}
    </Container>
  );
} 
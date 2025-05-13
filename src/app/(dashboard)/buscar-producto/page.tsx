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
  ultimo_costo?: number;
  costo_compra?: number;
  precio_ant1?: number;
  precio1?: number;
  margen_ant1?: number;
  margen1?: number;
  impprecio_ant1?: number;
  impprecio1?: number;
  fecha_act_ant?: string;
  fecha_act?: string;
  [key: string]: string | number | undefined;
}

interface ProductoCentral {
  name: string;
  sku: string;
  price: number;
  isAvailable: boolean;
}

interface PrecioProveedor {
  id: number;
  cod_art: string;
  cod_barra?: string;
  proveedor: string;
  precio: number;
  fecha: string;
  usuario?: string;
  observaciones?: string;
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
  const [proveedor, setProveedor] = useState("");
  const [precioProveedor, setPrecioProveedor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [historialProveedores, setHistorialProveedores] = useState<PrecioProveedor[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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
      let codigoCentral = codeToSearch;
      if (Array.isArray(json) && json.length > 0 && json[0].cod_barra) {
        codigoCentral = json[0].cod_barra;
      }
      const centralRes = await fetch(`/api/centralmayorista?code=${encodeURIComponent(codigoCentral)}`);
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

  // Consultar historial de precios por proveedor cuando cambia el producto
  useEffect(() => {
    if (result && result.length > 0) {
      fetch(`/api/precios-proveedor?cod_art=${encodeURIComponent(result[0].cod_art)}&tienda=${tienda}`)
        .then(res => res.json())
        .then(data => setHistorialProveedores(Array.isArray(data) ? data : []));
    } else {
      setHistorialProveedores([]);
    }
  }, [result, tienda]);

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
        <div className="overflow-x-auto w-full">
          <table className="min-w-full border text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100">
                {["descripcion","ultimo_costo","costo_compra","impprecio_ant1","impprecio1","cod_art","cod_barra","fecha_act_ant","fecha_act"].map((key) => (
                  result.length > 0 && key in result[0] ? (
                    <th key={key} className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{key === 'ultimo_costo' ? 'costo + iva' : key === 'impprecio1' ? 'precio de venta al publico' : key}</th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {result.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">No se encontró el producto.</td>
                </tr>
              ) : (
                result.map((p, i) => (
                  <tr key={i}>
                    {["descripcion","ultimo_costo","costo_compra","impprecio_ant1","impprecio1","cod_art","cod_barra","fecha_act_ant","fecha_act"].map((key) => (
                      key in p ? (
                        <td key={key} className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">
                          {typeof p[key] === "number"
                            ? p[key].toLocaleString("es-CL")
                            : typeof p[key] === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(p[key] as string)
                              ? new Date(p[key] as string).toISOString()
                              : p[key] != null
                                ? p[key].toString()
                                : ""}
                        </td>
                      ) : null
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
      {/* Formulario y tabla de historial de proveedores */}
      {result && result.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Registrar precio de proveedor</h2>
          <form
            className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-end mb-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setGuardando(true);
              setMensaje("");
              const res = await fetch("/api/precios-proveedor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cod_art: result[0].cod_art,
                  cod_barra: result[0].cod_barra,
                  proveedor,
                  precio: Number(precioProveedor),
                  usuario: "usuario-demo", // Cambia por el usuario real si tienes auth
                  observaciones,
                  tienda,
                }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                setMensaje("¡Registro guardado exitosamente!");
                setProveedor("");
                setPrecioProveedor("");
                setObservaciones("");
              } else {
                setMensaje("Error al guardar el registro");
              }
              setGuardando(false);
              // Refrescar historial
              fetch(`/api/precios-proveedor?cod_art=${encodeURIComponent(result[0].cod_art)}&tienda=${tienda}`)
                .then(res => res.json())
                .then(data => setHistorialProveedores(Array.isArray(data) ? data : []));
            }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Proveedor</label>
              <input type="text" className="border rounded px-2 py-1 text-xs sm:text-sm w-full" value={proveedor} onChange={e => setProveedor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Precio</label>
              <input type="number" className="border rounded px-2 py-1 text-xs sm:text-sm w-full" value={precioProveedor} onChange={e => setPrecioProveedor(e.target.value)} required min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Observaciones</label>
              <input type="text" className="border rounded px-2 py-1 text-xs sm:text-sm w-full" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-xs sm:text-sm w-full sm:w-auto" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </form>
          {mensaje && <div className={mensaje.startsWith('¡') ? 'text-green-600 mb-2' : 'text-red-600 mb-2'}>{mensaje}</div>}
          <h2 className="text-lg font-bold mb-2">Historial de precios por proveedor</h2>
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Proveedor</th>
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Precio</th>
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Fecha</th>
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Usuario</th>
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Observaciones</th>
                  <th className="px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialProveedores.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4">Sin registros</td></tr>
                ) : (
                  historialProveedores.map((h) => (
                    <tr key={h.id}>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{h.proveedor}</td>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{h.precio.toLocaleString("es-CL")}</td>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{h.fecha ? new Date(h.fecha).toLocaleString() : ""}</td>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{h.usuario || ""}</td>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">{h.observaciones || ""}</td>
                      <td className="border px-2 py-1 border whitespace-nowrap text-xs sm:text-sm">
                        <button
                          className="text-red-600 hover:underline"
                          title="Eliminar"
                          onClick={async () => {
                            if (window.confirm('¿Eliminar este registro?')) {
                              await fetch(`/api/precios-proveedor/${h.id}?tienda=${tienda}`, { method: 'DELETE' });
                              // Refrescar historial
                              fetch(`/api/precios-proveedor?cod_art=${encodeURIComponent(result[0].cod_art)}&tienda=${tienda}`)
                                .then(res => res.json())
                                .then(data => setHistorialProveedores(Array.isArray(data) ? data : []));
                            }
                          }}
                        >🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
} 
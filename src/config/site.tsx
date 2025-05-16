import { Gauge, type LucideIcon, BarChart2 } from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "VisActor Next Template",
  description: "Template for VisActor and Next.js",
};

export const navigations: Navigation[] = [
  {
    icon: Gauge,
    name: "Dashboard",
    href: "/",
  },
  {
    icon: Gauge,
    name: "ABC",
    href: "/abc-productos",
  },
  {
    icon: BarChart2,
    name: "Ventas por hora",
    href: "/ventas-por-hora",
  },
  {
    icon: BarChart2,
    name: "Ticket promedio diario",
    href: "/ticket-promedio-diario",
  },
  {
    icon: BarChart2,
    name: "Buscar producto",
    href: "/buscar-producto",
  },
  {
    icon: BarChart2,
    name: "Ventas manuales",
    href: "/ventas-manuales",
  },
  {
    icon: BarChart2,
    name: "MCM",
    href: "/margen-contribucion-mensual",
  },
  {
    icon: BarChart2,
    name: "Gastos mensuales",
    href: "/gastos-mensuales",
  },
];

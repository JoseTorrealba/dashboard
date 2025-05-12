import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "El código es requerido" }), { status: 400 });
  }

  try {
    const res = await fetch("https://nextgentheadless.instaleap.io/api/v3", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "SearchProducts",
        variables: {
          searchProductsInput: {
            clientId: "CENTRAL_MAYORISTA",
            storeReference: "159",
            currentPage: 1,
            minScore: 1,
            pageSize: 100,
            search: [{ query: code }],
            filters: {},
            googleAnalyticsSessionId: ""
          }
        },
        query: `query SearchProducts($searchProductsInput: SearchProductsInput!) {\n  searchProducts(searchProductsInput: $searchProductsInput) {\n    products {\n      name\n      sku\n      price\n      isAvailable\n    }\n    pagination {\n      page\n      pages\n      total {\n        value\n      }\n    }\n  }\n}`
      })
    });
    const data = await res.json();
    const productos = data?.data?.searchProducts?.products || [];
    return new Response(JSON.stringify(productos), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Error al consultar Central Mayorista" }), { status: 500 });
  }
} 
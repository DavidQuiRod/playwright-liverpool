// utils/productos.ts
import { Page, Request, Response } from '@playwright/test';

export interface ProductoUI {
  nombre: string;
  precios: number[];
}

export interface ProductoRed {
  id: string;
  nombre: string;
  precioVenta: number;
  precioLista: number;
  precioPromo?: number;
}

export interface PayloadsInterceptados {
  url: string;
  orden: number;
  productos: ProductoRed[];
}

export interface Discrepancia {
  posicionUI: number;
  tipo: 'NO_ENCONTRADO' | 'DIFERENCIA_PRECIO' | 'DIFERENCIA_NOMBRE';
  detalle: string;
}

/**
 * Escucha las respuestas de red que corresponden a la búsqueda/catálogo de Liverpool
 */
export function capturarRespuestasJson(page: Page) {
  const payloads: PayloadsInterceptados[] = [];
  let contador = 0;

  page.on('response', async (response: Response) => {
    const url = response.url();
    if ((url.includes('/plp') || url.includes('search') || url.includes('null')) && response.status() === 200) {
      try {
        const json = await response.json();
        if (json?.data?.records && Array.isArray(json.data.records)) {
          contador++;
          const productos: ProductoRed[] = json.data.records.map((rec: any) => ({
            id: rec.productId || rec.skuRepositoryId,
            nombre: rec.title?.trim() || '',
            precioVenta: rec.priceInfo?.salePrice || 0,
            precioLista: rec.priceInfo?.listPrice?.price || rec.priceInfo?.listPrice?.minPrice || 0,
            precioPromo: rec.priceInfo?.promoPrice?.price || rec.priceInfo?.promoPrice?.minPrice || 0,
          }));

          payloads.push({ url, orden: contador, productos });
        }
      } catch (e) {
        // Ignorar respuestas que no sean JSON válido
      }
    }
  });

  return {
    payloads,
    marca: () => contador,
    esperar: async () => await page.waitForTimeout(1000),
  };
}

/**
 * Parsea el texto extraído del DOM/UI a un objeto ProductoUI
 */
export function parsearTarjetaUI(texto: string): ProductoUI {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const nombre = lineas[0] || 'Producto sin nombre';
  
  const matchesPrecio = texto.match(/\$\s*([\d,]+(\.\d{1,2})?)/g) || [];
  const precios = matchesPrecio.map(p => parseFloat(p.replace(/[^\d.]/g, '')));

  return { nombre, precios };
}

/**
 * Compara los productos mostrados en la UI contra los devueltos en la red
 */
export function compararUIvsRed(productosUI: ProductoUI[], productosRed: ProductoRed[]) {
  const coincidencias: { ui: ProductoUI; red: ProductoRed }[] = [];
  const discrepancias: Discrepancia[] = [];

  productosUI.forEach((pUI, index) => {
    const posUI = index + 1;
    
    // Buscamos el producto en la red de manera flexible
    const coincide = productosRed.find(pRed => 
      pRed.nombre.toLowerCase().includes(pUI.nombre.toLowerCase().slice(0, 15)) ||
      pUI.nombre.toLowerCase().includes(pRed.nombre.toLowerCase().slice(0, 15))
    );

    // Si 'coincide' es undefined, registramos la discrepancia y evitamos que falle
    if (!coincide) {
      discrepancias.push({
        posicionUI: posUI,
        tipo: 'NO_ENCONTRADO',
        detalle: `El producto de la UI "${pUI.nombre}" no fue encontrado entre los ${productosRed.length} productos de la respuesta de red.`,
      });
    } else {
      // Como TypeScript ya sabe aquí que 'coincide' (pRed) está definido, podemos usarlo con seguridad
      coincidencias.push({ ui: pUI, red: coincide });

      const preciosRedValidos = [coincide.precioVenta, coincide.precioLista, coincide.precioPromo].filter(
        (precio): precio is number => typeof precio === 'number' && !Number.isNaN(precio)
      );
      const precioUIMatch = pUI.precios.some(precioUI =>
        preciosRedValidos.some(precioRed => Math.abs(precioRed - precioUI) < 1.0)
      );

      if (!precioUIMatch) {
        discrepancias.push({
          posicionUI: posUI,
          tipo: 'DIFERENCIA_PRECIO',
          detalle: `Diferencia de precio en "${pUI.nombre}". UI: [${pUI.precios.join(', ')}], Red (Promo/Venta/Lista): [${preciosRedValidos.join(', ')}]`,
        });
      }

      if (pUI.nombre.toLowerCase() !== coincide.nombre.toLowerCase()) {
        discrepancias.push({
          posicionUI: posUI,
          tipo: 'DIFERENCIA_NOMBRE',
          detalle: `Variación en el nombre. UI: "${pUI.nombre}" vs Red: "${coincide.nombre}"`,
        });
      }
    }
  });

  return { coincidencias, discrepancias };
}
import { test, expect } from '@playwright/test';
import {
    capturarRespuestasJson, compararUIvsRed, parsearTarjetaUI, ProductoUI,
} from '../utils/productos';

const URL_HOME = 'https://www.liverpool.com.mx/home';
//const URL_HOME='https://www.liverpool.com.mx/tienda?s=playstation%205';
const PRODUCTO = 'playstation 5';
const COLOR = 'Blanco';
const tipoDeOrdenDeProductos = 'Menor precio';

test.use({
    channel: 'chrome',
    headless: process.env.HEADED !== '1',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
});

test('Extraer 5 productos de PS5 y validar cruzadamente UI vs Red', async ({ page }, testInfo) => {
    // 1. Escuchador/Interceptor de Red antes de realizar búsquedas
    const red = capturarRespuestasJson(page);

    await page.goto(URL_HOME, { waitUntil: 'domcontentloaded' });

    expect(await page.title(), 'La página devolvió Access Denied (bloqueo anti-bot)')
        .not.toMatch(/access denied/i);


    // 2. Realizar búsqueda
    const buscador = page.getByPlaceholder('Buscar por producto, categoría y más...').first();
    await buscador.fill(PRODUCTO);
    await buscador.press('Enter');
    await expect(page.getByTestId('plp-page-heading-title-title')).toHaveText(/playstation 5/i);

    // 3. Aplicar Filtro de color
    await page.locator('.border-b').getByRole('checkbox', { name: COLOR }).click();
    //await page.screenshot({ path: testInfo.outputPath('capturaColor.png'), fullPage: true });

    // 4. Aplicar Ordenamiento por Menor precio
    const marca = red.marca();
    await page.getByRole('button', { name: 'Ordenar por: ' }).click();
    await page.getByRole('listbox', { name: 'Sorting options' }).getByText(tipoDeOrdenDeProductos).click();
    //await page.screenshot({ path: testInfo.outputPath('filtroDePrecio.png'), fullPage: true });

    // 5. Capa UI: Extracción de los 5 primeros productos visibles
    const secciones = page.locator('.flex-1.gap-2.flex.flex-col');
    await expect(secciones.first()).toBeVisible();

    const textos = await secciones.evaluateAll(els =>
        els.slice(0, 5).map(e => (e as HTMLElement).innerText));
    const productosUI: ProductoUI[] = textos.map(parsearTarjetaUI);

    expect(productosUI).toHaveLength(5);
    console.log('\n--- PRODUCTOS EXTRAÍDOS DE LA UI ---');
    productosUI.forEach((p, i) => console.log(`${i + 1}. ${p.nombre} | $${p.precios.join(' / $')}`));

    // 6. Capa de Red: Esperar a que la respuesta tras ordenar sea interceptada
    await red.esperar();
    
    expect(
        red.payloads.length,
        'No se interceptó ninguna respuesta con productos. Verifica la regla en capturarRespuestasJson.'
    ).toBeGreaterThan(0);

    // Seleccionamos la última respuesta capturada (representa el estado final tras aplicar los filtros/orden)
    const payload = red.payloads[red.payloads.length - 1]; 
    console.log(`\nRespuesta de Red interceptada: ${payload.url} (${payload.productos.length} productos devueltos)`);

    // 7. Validación Cruzada UI vs Red
    const { coincidencias, discrepancias } = compararUIvsRed(productosUI, payload.productos);

    console.log(`\n--- RESULTADOS DE VALIDACIÓN CRUZADA ---`);
    console.log(`Coincidencias encontradas: ${coincidencias.length}/5`);
    
    if (discrepancias.length > 0) {
        console.warn('\n⚠️ Discrepancias / Diferencias detectadas:');
        discrepancias.forEach(d => console.warn(` - [Producto UI #${d.posicionUI}] [${d.tipo}]: ${d.detalle}`));
    } else {
        console.log('✅ Sin discrepancias detectadas entre la UI y la respuesta de Red.');
    }

    // 8. Adjuntar reportes de evidencia al testInfo de Playwright
    await testInfo.attach('productos-ui.json', { body: JSON.stringify(productosUI, null, 2), contentType: 'application/json' });
    await testInfo.attach('productos-red.json', { body: JSON.stringify(payload, null, 2), contentType: 'application/json' });
    await testInfo.attach('reporte-discrepancias.json', { body: JSON.stringify({ coincidencias, discrepancias }, null, 2), contentType: 'application/json' });

    // 9. Asertividad requerida: Afirmar que al menos 3 de los 5 resultados de la UI aparecen en la red
    expect(
        coincidencias.length,
        `Se esperaban al menos 3 coincidencias, pero solo ${coincidencias.length}/5 productos de la UI se encontraron en la red.`
    ).toBeGreaterThanOrEqual(3);
});

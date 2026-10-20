# Estrategia de Pruebas: Automatización E2E y Capa de Red (Liverpool)

## 1. ¿Qué aspectos de este proceso no automatizarías y por qué?
 La fluides de las animaciones y clases de estilo, ya que algunas veces se tardan en cargar todo o se pierder por alguna interrupcion de conexion. Los procesos de pago en un ambiente productivo puede ser dañinos para la parte de perdida de datos o alguien mas pueda verlos, en ambientes controlados como SIT o UAT si funciona porque los datos son dummy o datos que no afectan a los clientes que ingresan sus datos personales.

## 2. Si Liverpool añadiera un CAPTCHA al proceso de búsqueda, ¿cómo lo gestionarías?
Trabajaria con el equipo de desarrollo y seguridad para solicitar que desahiliten el captcha. Otra forma seria que se cree un toque en los heades de las peticiones http de la API para que se omita la seguridad.

## 3. ¿Qué riesgos de inestabilidad (*flakiness*) existen en esta prueba y cómo los mitigaste?
 Las peticiones XHR/Fetch pueden demorar o fallar intermitentemente. 
  * *Mitigación:* Se implementó un listener temprano de red (`page.on('response')`) combinado con `expect.poll()` para asegurar la recepción de los payloads sin depender únicamente de esperas fijas (`waitForTimeout`).
Los bloqueos de Anti-Bot de los sitios de comercio electrónico bloquean peticiones automatizadas masivas.
  * *Mitigación:* Uso de un canal real de Chrome (`channel: 'chrome'`), emulación de cabeceras de usuario legítimas (`locale`, `timezoneId`) y control de la ejecución en modo headless/headed.s

## 4. Si tuvieras que añadir esto a la canalización con más de 50 conjuntos de pruebas, ¿qué cambiarías?
 Generar workers de trabajo donde en una parte solo vengan las validaciones de las APIs y contratos de datos de pruebas unitarias, las pruebas e2e las integracias a otro worker  para revisar los flujos criticos con la UI.
 Tambien dividiria la carga de trabajo dependiendo el impacto de cada una de las pruebas, las dividiria por prioridas y que tanto impacto tengan.
 Una forma para avanzar seria generar un pipeline que ejecute en las noches los CI.
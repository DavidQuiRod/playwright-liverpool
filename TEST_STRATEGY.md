# Estrategia de Pruebas: Automatización E2E y Capa de Red (Liverpool)

## 1. ¿Qué aspectos de este proceso no automatizarías y por qué?
* **Diseño visual y experiencia de usuario (UX):** La percepción estética, la armonía visual de las tarjetas de productos, la fluidez de las animaciones CSS o la legibilidad tipográfica no se automatizan mediante scripts funcionales. Su mantenimiento es costoso y propenso a falsos positivos por cambios menores de estilo.
* **Procesos de pasarela de pago real y autenticación con factores externos (MFA/OTP):** Interactuar con pasarelas bancarias externas o introducir códigos SMS reales en producción introduce riesgos de bloqueo, costos operativos y alta inestabilidad. Se prefieren los entornos simulados o mocks controlados.

## 2. Si Liverpool añadiera un CAPTCHA al proceso de búsqueda, ¿cómo lo gestionarías?
* **Ambientes de pruebas dedicados:** Trabajar con el equipo de desarrollo y seguridad para asegurar que los entornos de QA/Staging tengan el CAPTCHA deshabilitado, o bien implementar una lista blanca de direcciones IP/headers de prueba (por ejemplo, un token secreto en las cabeceras HTTP que omita el reto de seguridad).
* **Evitar solucionadores automáticos de terceros:** No se deben usar servicios externos de resolución de CAPTCHA en flujos automatizados de CI/CD debido a su alto costo, latencia y la inestabilidad que aportan a las canalizaciones.

## 3. ¿Qué riesgos de inestabilidad (*flakiness*) existen en esta prueba y cómo los mitigaste?
* **Latencia de red y carga asíncrona:** Las peticiones XHR/Fetch pueden demorar o fallar intermitentemente. 
  * *Mitigación:* Se implementó un listener temprano de red (`page.on('response')`) combinado con `expect.poll()` para asegurar la recepción de los payloads sin depender únicamente de esperas fijas (`waitForTimeout`).
* **Bloqueos Anti-Bot (Access Denied):** Sitios de comercio electrónico bloquean peticiones automatizadas masivas.
  * *Mitigación:* Uso de un canal real de Chrome (`channel: 'chrome'`), emulación de cabeceras de usuario legítimas (`locale`, `timezoneId`) y control de la ejecución en modo headless/headed.

## 4. Si tuvieras que añadir esto a la canalización con más de 50 conjuntos de pruebas, ¿qué cambiarías?
* **Estrategia de ejecución por capas (Test Pyramid):** Mover las validaciones puramente de API y contratos de datos a pruebas unitarias/de integración rápidas, dejando las pruebas E2E de interfaz de usuario solo para flujos críticos (Smoke Tests).
* **Paralelización y Sharding:** Dividir la ejecución masiva en paralelo utilizando la característica de *Sharding* de Playwright (`--shard=x/y`) en múltiples contenedores de CI para reducir el tiempo total de retroalimentación.
* **Optimización de recursos:** Ejecutar conjuntos pesados de interceptación de red únicamente en despliegues nocturnos (*nightly builds*) o en solicitudes aprobadas para Pull Requests específicos, evitando sobrecargar el pipeline en cada commit menor.
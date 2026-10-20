# Automatización E2E y Validación de Red con Playwright (Liverpool)

[![Playwright Tests](https://github.com/TU_USUARIO/TU_REPOSITORIO/actions/workflows/test.yml/badge.svg)](https://github.com/TU_USUARIO/TU_REPOSITORIO/actions/workflows/test.yml)

Este proyecto contiene una suite de pruebas automatizadas desarrollada con **Playwright** y **TypeScript**. Valida los resultados de búsqueda de la tienda en línea **Liverpool** (buscando "playstation 5", aplicando filtros de color y ordenamiento), realizando una validación cruzada avanzada entre los elementos de la interfaz de usuario (UI) y las respuestas interceptadas de la red (servicios).

---

## 📋 Requisitos Previos

Asegúrate de tener instalado en tu equipo:
* [Node.js](https://nodejs.org/) (versión LTS recomendada)
* Git

---

## ⚙️ Cómo instalarlo y ejecutarlo localmente

1. **Clona el repositorio:**
   ```bash
   git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
   cd TU_REPOSITORIO

# 2. Instalar las dependencias del proyecto
npm install

# 3. Instalar los navegadores y dependencias de Playwright
npx playwright install --with-deps

# 4. Ejecuta las pruebas
npx playwright test

# 5. Visualiza el reporte HTML generado
npx playwright show-report

# 6. Modo sin interfaz gráfica (Headless - Predeterminado)
npx playwright test

# 7. Modo con interfaz gráfica (Headed / Con cabecera)
npx playwright test --headed

#### Integración Continua (GitHub Actions) ###

El proyecto cuenta con un flujo de trabajo configurado en .github/workflows/test.yml que se encarga de:

Instalar Node.js y las dependencias del proyecto.

Ejecutar las pruebas de Playwright de forma automática en modo headless.

Generar y almacenar el informe HTML de Playwright como un artefacto descargable por cada ejecución.

Puedes ver el estado actual de las ejecuciones o acceder al historial de pruebas exitosas aquí:
👉 Ver ejecuciones en GitHub Actions

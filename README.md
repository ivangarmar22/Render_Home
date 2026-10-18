# Vivienda 10 · asianPark 25

Recorrido interactivo en 3D de la vivienda 10 y su urbanización, desarrollado con Three.js y Vite.

La interfaz se adapta a móvil y tablet, con controles táctiles y un encuadre específico para orientación vertical.

Al iniciar, puedes elegir entre gráficos normales y detallados. El modo detallado usa el entorno HDR, materiales PBR hasta 4K en escritorio (2K en pantallas táctiles), mayor filtrado anisotrópico, antialiasing y oclusión ambiental de alta calidad. También muestra directamente el color de las texturas de yeso y reduce el tono cálido, el bloom y el viñeteado. Puede exigir más a la tarjeta gráfica.
La paleta del modo detallado toma como referencia las imágenes del anuncio: paredes lisas en blanco cálido, suelo de roble natural de tono medio, carpintería de cocina greige, piedra beige, cerámica clara y textiles neutros. Los sofás conservan sus mapas de tejido con un tono beige; el pasamanos es de madera oscura, al igual que los listones del sótano y los muebles bajo la TV. La iluminación interior incluye relleno cálido para suavizar las sombras. Se han retirado las pérgolas metálicas de las zonas comunes y de la piscina; se conserva la distribución de las estancias. La galería incluye imágenes de *home staging*, por lo que los acabados se usan como referencia visual y no como especificación contractual.
En vista libre, el botón **Planos** reúne las cuatro plantas acotadas y las superficies disponibles por estancia; los planos se desplazan dentro del diálogo. Las cotas y superficies sin dato explícito se estiman a partir del modelo y se marcan con `≈`; las cotas globales de plantas irregulares no equivalen necesariamente a su superficie útil. En gráficos detallados, las camas usan tejidos con relieve, ropa de cama con pliegues suaves y almohadas acolchadas.
También carga modelos CC0 de Poly Haven para el sofá y el conjunto de comedor principal; el modo normal conserva los muebles ligeros de geometría procedural.

## Desarrollo

Necesitas Node.js 22 o posterior.

```sh
npm ci
npm run dev
```

Para generar la versión de producción:

```sh
npm run build
npm run preview
```

## Publicación

GitHub Actions compila y publica `dist` en GitHub Pages con cada cambio en `main`. También se puede iniciar manualmente desde **Actions → Deploy to GitHub Pages → Run workflow**.

URL: <https://ivangarmar22.github.io/Render_Home/>

La primera publicación requiere que GitHub Pages esté habilitado para el repositorio y use **GitHub Actions** como origen. Los archivos publicados se generan desde el código; no se sube `dist`.

## Recursos

Las texturas y los modelos usados por la escena están en `public/`. Los scripts opcionales para descargarlos de nuevo son `npm run textures` y `npm run models`.

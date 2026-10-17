# Vivienda 10 · asianPark 25

Recorrido interactivo en 3D de la vivienda 10 y su urbanización, desarrollado con Three.js y Vite.

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

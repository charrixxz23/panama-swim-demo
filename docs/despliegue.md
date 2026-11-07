# Despliegue

## Local

```bash
npm ci
npm run dev                  # http://localhost:5173/panama-swim-demo/
npm run typecheck && npm test
npm run build                # dist/ con 404.html y .nojekyll
npm run preview              # sirve dist/ como GitHub Pages: http://localhost:4173/panama-swim-demo/
npx playwright install chromium && npm run test:e2e
```

En Windows (PowerShell) son los mismos comandos.

## GitHub Pages (`charrixxz23/panama-swim-demo`)

El flujo `.github/workflows/deploy.yml` se ejecuta en cada *push* a `main` y manualmente:

1. `npm ci`.
2. Calcula la ruta base `/<repositorio>/` y la URL `https://<usuario>.github.io/<repositorio>/`.
3. Verifica tipos, ejecuta las pruebas unitarias, compila y ejecuta las pruebas de navegador en 4 perfiles.
4. Publica `dist/` con `actions/deploy-pages`. Si algo falla, el despliegue se detiene y el informe de Playwright queda como artefacto.

Primera vez:

```bash
gh api -X POST repos/charrixxz23/panama-swim-demo/pages -f build_type=workflow
gh workflow run deploy.yml
```

O en *Settings → Pages → Source: GitHub Actions*.

## Rutas internas

Se usa `BrowserRouter` con `basename`. Como GitHub Pages no conoce las rutas de la aplicación, `scripts/postbuild.mjs` copia `index.html` como `404.html`: cualquier ruta interna carga la aplicación y muestra la página correcta, también al recargar. Esas rutas responden con código HTTP 404, aunque se ven bien. Para un sitio oficial con SEO conviene un alojamiento con reescrituras o el pre-renderizado de rutas.

## Otro dominio o cuenta

Compile con `BASE_PATH=/` y `SITE_URL=https://su-dominio/` y añada `public/CNAME`. En otra cuenta, el flujo calcula la URL solo; actualice `SITE.author` en `src/data/reference.ts`.

## Capturas para el README

```bash
npx playwright install chromium
node scripts/screenshots.mjs https://charrixxz23.github.io/panama-swim-demo/
```

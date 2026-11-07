// GitHub Pages no conoce las rutas de la SPA: sirve 404.html para /tv, /noticias/..., etc.
// Copiar index.html como 404.html hace que esas rutas carguen la aplicación.
import { copyFileSync, existsSync, writeFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
if (!existsSync("dist/.nojekyll")) writeFileSync("dist/.nojekyll", "");
console.log("postbuild: dist/404.html y dist/.nojekyll listos");

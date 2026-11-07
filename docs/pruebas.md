# Pruebas y resultados

Ejecutadas el 7 de noviembre de 2026 sobre una **copia limpia extraída del ZIP**, en Linux con Node.js 22, npm 10.9 y Chromium (Playwright 1.63).

| Comprobación | Comando | Resultado |
|---|---|---|
| Instalación reproducible | `npm ci` | Correcta; `found 0 vulnerabilities` |
| Tipos (TypeScript estricto) | `npm run typecheck` | Sin errores |
| Pruebas unitarias (Vitest) | `npm test` | **49 aprobadas** en 7 archivos |
| Compilación | `npm run build` | Sin errores; genera `404.html` y `.nojekyll` |
| Extremo a extremo (Playwright) | `npm run test:e2e` | **124 aprobadas** (31 pruebas × 4 perfiles: escritorio 1440 × 900, tableta iPad, Android Pixel 7 e iPhone 14) |

## Pruebas unitarias (`tests/unit`)

| Archivo | Qué verifica |
|---|---|
| `time.test.ts` | `parseTime` y `formatTime`: minutos y segundos, coma decimal, décimas, rechazo de formatos inválidos (`1:75.20`, `1:4.80`, `1:04`…), resultados siempre enteros (ida y vuelta para 540 valores), sin confundir segundos con minutos (`64.80` = `1:04.80`), diferencias con signo. |
| `standards.test.ts` | Ejemplo del enunciado (1:04.80 frente a 1:02.00 = 2.80 s y 4.52 %); igualar o mejorar cuenta como alcanzar; un tiempo mayor nunca alcanza; rechazo de valores no enteros; `findStandard` no usa otra piscina, prueba, rama ni categoría, ni marcas no publicadas; `bestTime` ignora DQ y separa piscinas. |
| `results.test.ts` | Ranking por prueba con empates, diferencia con el primero, y DQ/DNF/DNS al final sin posición ni tiempo. |
| `calendar.test.ts` | Fases (próxima, en curso, finalizada) y estado de inscripción; con tres fechas distintas, ninguna competencia vencida aparece como próxima; categoría por año de nacimiento. |
| `csv.test.ts` | Analizador CSV (BOM, comillas, `;`); el CSV de ejemplo valida sin errores; el CSV con errores marca duplicado, nadador inexistente, tiempo inválido, serie no numérica, OK sin tiempo y estado desconocido; columnas faltantes; categoría y rama equivocadas; prueba de otra competencia; duplicado con datos existentes; DQ con tiempo (se ignora y avisa); carril ocupado; archivo vacío. |
| `dataset.test.ts` | Todo lo que representa personas y competencias es sintético; clubes y sedes ficticias rotuladas; los nadadores no tienen campos de contacto ni fecha completa; tiempos enteros en centésimas; coherencia resultado–prueba–categoría–rama; sin duplicados; marcas en la piscina de su competencia; progresión exacta del ejemplo; aviso legal exacto; noticias con fecha y enlace https; recorrido de 10 pasos. |
| `store.test.tsx` | Flujo completo de importación (pendiente → publicar), persistencia al recrear el proveedor, restaurar, funcionamiento sin almacenamiento, datos guardados corruptos, generación del programa de pruebas al crear una competencia y descripción textual de la gráfica. |

## Pruebas de navegador (`tests/e2e/app.spec.ts`)

En los 4 perfiles, con la fecha fijada en el 7/11/2026 para que sean deterministas:

- **13 rutas** cargadas directamente (simula recargar en GitHub Pages): sin errores de consola, sin desbordamiento horizontal y sin que el navegador móvil aleje la página; aviso legal en el pie.
- 404 propia, navegación principal (barra y menú móvil), cambio de **modo claro y oscuro** recordado tras recargar.
- **Calendario**: Copa Azuero (octubre) en «Finalizadas» y no en «Próximas»; filtro por provincia; búsqueda vacía; vista mensual y cambio de mes; con la fecha 1/6/2027 no queda nada próximo.
- **Ficha**: «Inscripción abierta» y marca 1:02.00 en 100 m libre masculino 13-14.
- **Resultados**: filtro por atleta (20 resultados en 20 pruebas), por piscina y por competencia; los DQ no muestran tiempo.
- **Comparador**: 1:02.00 / 1:04.80 / +2.80 s / +4.52 % y el mensaje del enunciado; un tiempo que alcanza la marca, con su aviso de que no es clasificación oficial; error de formato; cambio a 25 m sin comparación ni conversión.
- **Perfil**: gráfica, marca de referencia ficticia y tabla de comparación con mejoras de −2.40.
- **Administración**: CSV válido → pendiente (no público) → publicar → visible y persistente tras recargar → restaurar; CSV con errores sin botón de importar; competencia con fechas inválidas rechazada, creada como borrador y visible en el calendario solo después de publicarla; marca mínima con formato validado.
- **Recorrido**: los 10 pasos en su ruta, resaltando su componente; Anterior y Siguiente; Finalizar sin dejar resaltado ni bloqueo; Omitir.
- Enlaces externos con `rel="noopener"`, primer Tab al enlace «Saltar al contenido», y el perfil sin año de nacimiento, arrobas, teléfonos ni documentos.

## Defectos encontrados y corregidos durante la validación

- En móvil, el texto oculto para lectores de pantalla dentro de las tablas (posicionado de forma absoluta) escapaba del contenedor con desplazamiento, y Chrome alejaba la página para encajarlo. La comprobación inicial de desbordamiento no lo detectaba. Se corrigió con `position: relative` en el contenedor de las tablas y se reforzó la prueba (`innerWidth` ≤ `clientWidth`).
- La etiqueta de la línea de marca mínima de la gráfica tenía un contraste de 3,6:1 en modo oscuro. Ahora usa el rojo del tema (5,8:1).
- Tres pruebas tenían selectores ambiguos (por ejemplo, «Inicio» coincidía con el enlace del logotipo). Se corrigieron en las pruebas, no en la aplicación.

## Lo que no se pudo verificar

| Elemento | Motivo | Cómo verificarlo |
|---|---|---|
| Fotografías de Unsplash | El entorno no tenía acceso a `images.unsplash.com`; se verificó el fondo de respaldo. | Abrir el sitio publicado o regenerar las capturas contra la URL pública. |
| Safari / WebKit real | Solo había Chromium; iPhone y iPad se emularon. | Probar en un iPhone. |
| Despliegue en GitHub Pages | Lo realiza el propietario de la cuenta. | Ver `despliegue.md`; el flujo ejecuta las mismas pruebas. |
| Lector de pantalla real | No hubo una auditoría con NVDA o VoiceOver. | Prueba manual recomendada. |

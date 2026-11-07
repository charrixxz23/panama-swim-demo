# Fuentes y datos

Investigación realizada el **7 de noviembre de 2026**.

## Dominios de referencia

| Dominio | Estado | Qué ofrece |
|---|---|---|
| [fpnpty.com](https://www.fpnpty.com/) | **Operativo.** Google Sites; pie: «Sitio Oficial de la Federación Panameña de Natación». | Historia, equipo, disciplinas, entrenadores, clubes afiliados 2025 (por liga provincial), transparencia (estatuto, finanzas, comunicados, sanciones), «Tiempos oficiales» y «Campeonato Nacional» (hojas de Google incrustadas), «Records LCM» (Google Sheets), documentos (manuales de registro y afiliación), calendario 2025 (Google Calendar incrustado), enlaces a World Aquatics, Panam Aquatics, CCCAN, Pandeportes, COP, Aquatics Integrity y ONAD. |
| access.fpnpty.com | Operativo, con inicio de sesión. | Plataforma con correo y contraseña. No se exploró su interior. |
| fpnatacion.org | No consultable de forma automática (el sitio lo bloquea). | Es el dominio que figura en la ficha del Comité Olímpico. |
| [copanama.com/federaciones](https://copanama.com/federaciones/) | Operativo. | Ficha de la FPN: sede en la Piscina Eileen Coparropa (Juan Díaz), presidencia y secretaría, sitio web y redes. |
| [worldaquatics.com](https://www.worldaquatics.com/) | Referencia internacional. | Reglamento y pruebas olímpicas. La demo usa las distancias y estilos habituales de piscina. |

La demo **no copia** datos de esas hojas, ni nombres de atletas, ni marcas reales.

## Categorías por edad (referencia pública)

| Categoría | Fuente |
|---|---|
| 9-10 («Infantil B»), 11-12, 13-14 («Juvenil A»), 15-17 («Juvenil B»), 18 y más («Senior») | SERTV/Nacional FM, 30/09/2014, sobre un Campeonato Nacional de la FPN |
| Exhibición 7-8, 9-10, 11-12, 13-14, 15-17, 18 y más | Panamá América, 02/02/2020, sobre un torneo evaluativo de la LPNP |

Pueden variar según cada convocatoria; el sistema permite editarlas en el conjunto de datos.

## Noticias verificadas (portada)

| Medio | Fecha | Título |
|---|---|---|
| TVN/TVMAX | 07/08/2026 | Eileen Coparropa felicita a Emily Santos por su cosecha de medallas en los Juegos Centroamericanos y del Caribe 2026 |
| Metro Libre | 05/06/2026 | La natación panameña eleva su nivel con el Gran Open Club |
| Panamá América | 02/02/2020 | Natación panameña se alista para su torneo nacional evaluativo |

## Qué es real y qué es ficticio

| Dato | Origen | Cómo se identifica en la interfaz |
|---|---|---|
| Categorías por edad | Referencia pública | Página «Acerca» |
| Piscina Olímpica Eileen Coparropa | Real | «Instalación real» en la ficha |
| Noticias | Reales (resumen propio) | Medio, fecha y enlace |
| Clubes | **Ficticios** | Nombre «Club Demo …», etiqueta «Clubes ficticios» |
| Entrenadores y nadadores | **Ficticios** | «Perfil ficticio», «Atletas ficticios» |
| Competencias | **Ficticias** | Etiqueta «Demo» y «Competencia ficticia» |
| Otras sedes | **Ficticias** | «Piscina Demo de …» y «sede ficticia» |
| Resultados | **Ficticios** | «Resultados ficticios»; los importados llevan «(importado)» |
| Marcas mínimas | **Ficticias** | «Marca mínima ficticia» |
| Daniel Pérez y su progresión de 100 m libre | **Ficticios** (ejemplo del enunciado) | «Ejemplo ficticio» |

## Generación de los datos sintéticos

`node scripts/generate-demo-data.mjs` produce `src/data/demo-dataset.json` y dos CSV de ejemplo en `public/samples/`. El generador:

- Usa una semilla fija, así que la salida es reproducible.
- Parte de tiempos de referencia por prueba y aplica factores de edad, rama, talento y mejora mensual.
- **Solo para fabricar datos ficticios** aplica un factor a la piscina corta. La aplicación nunca convierte tiempos entre piscinas.
- Fija la progresión del ejemplo (1:14.20 → 1:11.80 → 1:09.50 → 1:07.10 → 1:04.80) y la marca ficticia de 1:02.00.
- Introduce DQ, DNS y DNF sin tiempo.

Contenido actual: 85 nadadores, 7 clubes, 10 entrenadores, 12 competencias (una en borrador), 814 pruebas, 1 324 resultados y 196 marcas mínimas.

## Fotografías

Unsplash (licencia Unsplash), cargadas desde su CDN: Gentrit Sylejmani (héroe), Omar Abozeid (bloques de salida) y Marcus Ng.

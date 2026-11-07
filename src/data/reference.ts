import type { NewsItem, Province } from "../models";

export const SITE = {
  name: "Panamá Swim",
  motto: "Cada segundo cuenta",
  disclaimer:
    "Prototipo académico independiente inspirado en la natación panameña. No representa una plataforma oficial de la Federación Panameña de Natación.",
  author: { handle: "charrixxz23", url: "https://github.com/charrixxz23" },
  repoUrl: "https://github.com/charrixxz23/panama-swim-demo",
  verifiedOn: "2026-11-07",
} as const;

export const PROVINCES: Province[] = [
  "Bocas del Toro",
  "Chiriquí",
  "Coclé",
  "Colón",
  "Darién",
  "Herrera",
  "Los Santos",
  "Panamá",
  "Panamá Oeste",
  "Veraguas",
];

/** Noticias reales verificadas: título exacto, medio, fecha y enlace. El resumen es propio. */
export const NEWS: NewsItem[] = [
  {
    id: "tvn-emily-santos-2026",
    title: "Eileen Coparropa felicita a Emily Santos por su cosecha de medallas en los Juegos Centroamericanos y del Caribe 2026",
    outlet: "TVN / TVMAX",
    url: "https://www.tvn-2.com/tvmax/mas-deportes/natacion/eileen-coparropa-emily-santos-medallas-natacion-juegos-cenrroamericanos-y-del-caribe-santo-domingo-2026_1_2254965.html",
    publishedOn: "2026-08-07",
    summary: "Nota sobre las tres medallas de plata de Emily Santos en los XXV Juegos Centroamericanos y del Caribe Santo Domingo 2026.",
    verifiedOn: "2026-11-07",
  },
  {
    id: "metrolibre-gran-open-2026",
    title: "La natación panameña eleva su nivel con el Gran Open Club",
    outlet: "Metro Libre",
    url: "https://www.metrolibre.com/deportes/la-natacion-panamena-eleva-su-nivel-con-el-gran-open-club-MA23014008",
    publishedOn: "2026-06-05",
    summary: "El Gran Open Club 2026 reunió a más de 35 clubes nacionales y 3 de Ecuador en la piscina Eileen Coparropa, del 4 al 7 de junio.",
    verifiedOn: "2026-11-07",
  },
  {
    id: "panamaamerica-evaluativo-2020",
    title: "Natación panameña se alista para su torneo nacional evaluativo",
    outlet: "Panamá América",
    url: "https://www.panamaamerica.com.pa/sinseccion/natacion-panamena-se-alista-para-su-torneo-nacional-evaluativo-1155500",
    publishedOn: "2020-02-02",
    summary: "Nota de 2020 sobre un torneo evaluativo de la Liga Provincial de Natación de Panamá con categorías de 9-10 a 18 y más años.",
    verifiedOn: "2026-11-07",
  },
];

/** Fuentes institucionales consultadas (ver docs/fuentes-y-datos.md). */
export const SOURCES = [
  { label: "Sitio de la Federación Panameña de Natación", url: "https://www.fpnpty.com/" },
  { label: "Comité Olímpico de Panamá: federaciones", url: "https://copanama.com/federaciones/" },
  { label: "World Aquatics", url: "https://www.worldaquatics.com/" },
];

/** Fotografías de Unsplash (licencia Unsplash), servidas desde su CDN. */
export const PHOTOS = {
  hero: {
    src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1800&q=70",
    alt: "Nadador en estilo mariposa en una piscina",
    credit: "Gentrit Sylejmani",
    page: "https://unsplash.com/photos/man-doing-butterfly-stroke-JjUyjE-oEbM",
  },
  blocks: {
    src: "https://images.unsplash.com/photo-1779831910049-43e9ae3c7dc6?auto=format&fit=crop&w=1200&q=70",
    alt: "Nadadores en los bloques de salida antes de una carrera",
    credit: "Omar Abozeid",
    page: "https://unsplash.com/photos/swimmers-poised-on-starting-blocks-before-a-race-MCHmYqBueek",
  },
  lanes: {
    src: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=70",
    alt: "Nadador en una piscina olímpica",
    credit: "Marcus Ng",
    page: "https://unsplash.com/photos/person-swimming-on-an-olympic-pool-ZbbhkQ0M2AM",
  },
} as const;

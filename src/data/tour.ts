export interface TourStep {
  id: string;
  title: string;
  text: string;
  /** Ruta con parámetros (la que se abre en ese paso). */
  route: string;
  target: string;
}

/** Flujo: competencia → nadador → historial → marca personal → marca mínima → comparación → progreso. */
export const TOUR_STEPS: TourStep[] = [
  { id: "dashboard", title: "El panel", text: "Próximas competencias, últimos resultados y accesos rápidos. Todo con datos demostrativos identificados.", route: "/", target: '[data-tour="dashboard"]' },
  { id: "calendario", title: "Calendario", text: "Vista mensual o de lista, con filtros por fecha, provincia, categoría y tipo. Lo finalizado nunca aparece como próximo.", route: "/calendario", target: '[data-tour="calendar"]' },
  { id: "competencia", title: "Una competencia", text: "La ficha reúne sede, piscina de 50 m, fechas y estado de inscripción calculado con la fecha de hoy.", route: "/competencias/nacional-lcm-2026", target: '[data-tour="comp-header"]' },
  { id: "pruebas", title: "Pruebas y requisitos", text: "El programa por categoría y rama, los requisitos y las marcas mínimas ficticias de esta competencia.", route: "/competencias/nacional-lcm-2026", target: '[data-tour="comp-events"]' },
  { id: "buscar", title: "Buscar un nadador", text: "Daniel Pérez es un atleta ficticio. Ningún perfil corresponde a una persona real.", route: "/nadadores?q=Daniel", target: '[data-tour="swimmer-search"]' },
  { id: "marcas", title: "Sus mejores marcas", text: "Las marcas personales se listan por prueba y por piscina: 25 m y 50 m nunca se mezclan.", route: "/nadadores/daniel-perez", target: '[data-tour="best-times"]' },
  { id: "comparar", title: "Comparar con la marca mínima", text: "Su mejor 100 m libre en 50 m frente a la marca ficticia del Campeonato Nacional: la diferencia se calcula en milisegundos.", route: "/marcas-minimas?nadador=daniel-perez&competencia=nacional-lcm-2026&prueba=100-LIBRE", target: '[data-tour="comparator-result"]' },
  { id: "historial", title: "Resultados históricos", text: "Todas sus pruebas, con posición, diferencia con el primero y estado (válido, DQ, DNS o DNF).", route: "/resultados?nadador=daniel-perez", target: '[data-tour="results-table"]' },
  { id: "progreso", title: "Progreso", text: "En natación, menos tiempo es mejor: por eso el eje está invertido y la línea sube cuando el nadador mejora.", route: "/nadadores/daniel-perez", target: '[data-tour="progress-chart"]' },
  { id: "admin", title: "Gestión demostrativa", text: "Crear competencias, importar resultados CSV con validación y publicar. Se guarda solo en este navegador.", route: "/admin", target: '[data-tour="admin"]' },
];

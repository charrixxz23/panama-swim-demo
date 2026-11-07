import { AlertTriangle, Check, Database, FileUp, RotateCcw, ShieldOff } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseBadge, DemoTag, Field, Time } from "../components/Bits";
import { ALL_EVENTS } from "../data/templates";
import type { CategoryId, Competition, CompetitionType, Course, Gender, QualifyingStandard, Stroke, Swimmer } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { validateResultsCsv, type CsvValidation } from "../services/csv";
import { fullName } from "../services/queries";
import { formatDate, formatRange } from "../utils/dates";
import { COMP_TYPES, COURSES, eventLabel, GENDERS, STROKES } from "../utils/labels";
import { slugify } from "../utils/text";
import { parseTime, TimeFormatError } from "../utils/time";

const TABS = [
  { id: "competencias", label: "Competencias" },
  { id: "importar", label: "Importar resultados" },
  { id: "marcas", label: "Marcas mínimas" },
  { id: "perfiles", label: "Perfiles" },
  { id: "revision", label: "Revisión y publicación" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const base = import.meta.env.BASE_URL;

function Notice({ tone = "ok", children }: { tone?: "ok" | "error"; children: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mt-4 flex gap-2 rounded-xl border p-3 text-sm ${tone === "error" ? "border-signal/40 bg-signal/5 text-signal" : "border-ok/40 bg-ok/5 text-ok"}`}>
      {tone === "error" ? <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> : <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------- competencias
const emptyComp = (): Competition => ({
  id: "",
  name: "",
  type: "copa",
  startDate: "",
  endDate: "",
  poolId: "eileen-coparropa",
  course: "LCM",
  categories: ["11-12", "13-14"],
  requirements: ["Afiliación vigente del club y del atleta (requisito ilustrativo)."],
  registration: { opens: "", closes: "" },
  documents: [{ title: "Convocatoria (documento de ejemplo)", url: null }],
  synthetic: true,
  published: false,
});

function CompetitionsTab() {
  const { data, ix, saveCompetition } = useData();
  const [draft, setDraft] = useState<Competition | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState("");
  const isNew = draft ? !ix.comp.has(draft.id) : false;
  const hasResults = draft ? data.results.some((r) => r.competitionId === draft.id) : false;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const errs: string[] = [];
    if (draft.name.trim().length < 4) errs.push("El nombre debe tener al menos 4 caracteres.");
    if (!draft.startDate || !draft.endDate) errs.push("Indique las fechas de inicio y fin.");
    else if (draft.endDate < draft.startDate) errs.push("La fecha de fin no puede ser anterior a la de inicio.");
    if (!draft.registration.opens || !draft.registration.closes) errs.push("Indique apertura y cierre de inscripción.");
    else {
      if (draft.registration.closes < draft.registration.opens) errs.push("El cierre de inscripción no puede ser anterior a la apertura.");
      if (draft.startDate && draft.registration.closes > draft.startDate) errs.push("La inscripción debe cerrar antes de que empiece la competencia.");
    }
    const pool = ix.pool.get(draft.poolId);
    if (pool && !pool.courses.includes(draft.course)) errs.push(`${pool.name} no figura con ${COURSES[draft.course].long.toLowerCase()}.`);
    if (draft.categories.length === 0) errs.push("Elija al menos una categoría.");
    setErrors(errs);
    if (errs.length) return;
    let id = draft.id;
    if (isNew) {
      id = slugify(`${draft.name} ${draft.startDate.slice(0, 4)}`);
      let n = 2;
      while (ix.comp.has(id)) id = `${slugify(draft.name)}-${n++}`;
    }
    saveCompetition({ ...draft, id, name: draft.name.trim(), requirements: draft.requirements.map((r) => r.trim()).filter(Boolean) });
    setSaved(isNew ? `«${draft.name.trim()}» se creó como borrador. Publíquela en «Revisión y publicación».` : `Cambios guardados en «${draft.name.trim()}».`);
    setDraft(null);
  };

  const pool = draft ? ix.pool.get(draft.poolId) : undefined;
  const sorted = [...data.competitions].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div>
      {saved && <Notice>{saved}</Notice>}
      {!draft ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{data.competitions.length} competencias (todas ficticias).</p>
            <button type="button" className="btn btn-primary" onClick={() => (setDraft(emptyComp()), setSaved(""), setErrors([]))}>
              Crear competencia
            </button>
          </div>
          <div className="table-wrap mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Competencia</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Piscina</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td className="text-muted">{formatRange(c.startDate, c.endDate)}</td>
                    <td>
                      <CourseBadge course={c.course} />
                    </td>
                    <td>{c.published ? <span className="text-ok">Publicada</span> : <span className="text-muted">Borrador</span>}</td>
                    <td className="text-right">
                      <button type="button" className="font-semibold text-brand hover:underline" onClick={() => (setDraft(structuredClone(c)), setSaved(""), setErrors([]))} aria-label={`Editar ${c.name}`}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="panel mt-4 grid gap-4 p-5 sm:grid-cols-2" aria-label={isNew ? "Nueva competencia" : "Editar competencia"}>
          <h3 className="h-card sm:col-span-2">{isNew ? "Nueva competencia" : `Editar: ${draft.name}`}</h3>
          <div className="sm:col-span-2">
            <Field label="Nombre" htmlFor="ac-name">
              <input id="ac-name" className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
          </div>
          <Field label="Tipo" htmlFor="ac-type">
            <select id="ac-type" className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CompetitionType })}>
              {(Object.keys(COMP_TYPES) as CompetitionType[]).map((t) => (
                <option key={t} value={t}>
                  {COMP_TYPES[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sede" htmlFor="ac-pool">
            <select id="ac-pool" className="field" value={draft.poolId} onChange={(e) => setDraft({ ...draft, poolId: e.target.value, course: ix.pool.get(e.target.value)!.courses[0] })}>
              {data.pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.province}){p.real ? "" : " · ficticia"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Inicio" htmlFor="ac-start">
            <input id="ac-start" type="date" className="field" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
          </Field>
          <Field label="Fin" htmlFor="ac-end">
            <input id="ac-end" type="date" className="field" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
          </Field>
          <Field label="Abre inscripción" htmlFor="ac-open">
            <input id="ac-open" type="date" className="field" value={draft.registration.opens} onChange={(e) => setDraft({ ...draft, registration: { ...draft.registration, opens: e.target.value } })} />
          </Field>
          <Field label="Cierra inscripción" htmlFor="ac-close">
            <input id="ac-close" type="date" className="field" value={draft.registration.closes} onChange={(e) => setDraft({ ...draft, registration: { ...draft.registration, closes: e.target.value } })} />
          </Field>
          <Field label="Longitud de piscina" htmlFor="ac-course">
            <select id="ac-course" className="field" value={draft.course} disabled={hasResults} onChange={(e) => setDraft({ ...draft, course: e.target.value as Course })}>
              {(pool?.courses ?? ["LCM", "SCM"]).map((c) => (
                <option key={c} value={c}>
                  {COURSES[c].long}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="min-w-0">
            <legend className="label">Categorías</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.categories.map((c) => {
                const on = draft.categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    disabled={hasResults}
                    onClick={() => setDraft({ ...draft, categories: on ? draft.categories.filter((x) => x !== c.id) : [...draft.categories, c.id] })}
                  >
                    {c.id}
                  </button>
                );
              })}
            </div>
            {hasResults && <p className="mt-1 text-xs text-muted">Ya tiene resultados: no se cambian piscina ni categorías.</p>}
          </fieldset>
          <div className="sm:col-span-2">
            <Field label="Requisitos (uno por línea)" htmlFor="ac-req">
              <textarea id="ac-req" rows={3} className="field" value={draft.requirements.join("\n")} onChange={(e) => setDraft({ ...draft, requirements: e.target.value.split("\n") })} />
            </Field>
          </div>
          {errors.length > 0 && (
            <div className="sm:col-span-2">
              <Notice tone="error">
                <ul className="list-disc pl-4">
                  {errors.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Notice>
            </div>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              {isNew ? "Crear borrador" : "Guardar cambios"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
              Cancelar
            </button>
          </div>
          {isNew && <p className="text-xs text-muted sm:col-span-2">El programa de pruebas se genera según las categorías elegidas.</p>}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------- importar CSV
function ImportTab({ goReview }: { goReview: () => void }) {
  const { data, importResults } = useData();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("pegado.csv");
  const [report, setReport] = useState<CsvValidation | null>(null);
  const [done, setDone] = useState("");
  const [readError, setReadError] = useState("");

  const onFile = async (file: File | undefined) => {
    setDone("");
    setReport(null);
    setReadError("");
    if (!file) return;
    if (file.size > 2_000_000) return setReadError("El archivo supera 2 MB.");
    try {
      setText(await file.text());
      setFileName(file.name);
    } catch {
      setReadError("No se pudo leer el archivo.");
    }
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="panel p-5">
        <h3 className="h-card flex items-center gap-2">
          <FileUp className="h-5 w-5 text-brand" aria-hidden="true" /> Archivo CSV
        </h3>
        <p className="mt-1 text-sm text-muted">
          Columnas: <code className="rounded bg-raised px-1">competencia_id, prueba_id, nadador_id, serie, carril, tiempo, estado</code>. Estados: OK, DQ, DNS, DNF.
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <a className="link" href={`${base}samples/resultados-copa-azuero-demo.csv`} download>
              CSV de ejemplo válido (Copa Azuero, 25 m)
            </a>
          </li>
          <li>
            <a className="link" href={`${base}samples/resultados-con-errores-demo.csv`} download>
              CSV de ejemplo con errores
            </a>
          </li>
        </ul>
        <div className="mt-4">
          <label htmlFor="csv-file" className="label">
            Elegir archivo
          </label>
          <input id="csv-file" type="file" accept=".csv,text/csv" className="field file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <div className="mt-4">
          <Field label="O pegue el contenido" htmlFor="csv-text">
            <textarea id="csv-text" rows={7} className="field font-mono text-xs" value={text} onChange={(e) => (setText(e.target.value), setFileName("pegado.csv"), setReport(null), setDone(""))} />
          </Field>
        </div>
        {readError && <Notice tone="error">{readError}</Notice>}
        <button type="button" className="btn btn-primary mt-4" disabled={!text.trim()} onClick={() => (setReport(validateResultsCsv(text, data)), setDone(""))}>
          Validar
        </button>
      </div>

      <div className="min-w-0">
        {!report && !done && <p className="text-sm text-muted">Valide un archivo para ver el informe. Nada se importa sin pasar la validación.</p>}
        {done && (
          <Notice>
            {done}{" "}
            <button type="button" className="font-semibold underline" onClick={goReview}>
              Ir a revisión
            </button>
          </Notice>
        )}
        {report && (
          <div className="panel p-5" data-testid="csv-report">
            <h3 className="h-card">Informe de validación</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-raised p-3">
                <dt className="text-xs text-muted">Filas</dt>
                <dd className="time text-2xl">{report.totalRows}</dd>
              </div>
              <div className="rounded-xl bg-ok/10 p-3">
                <dt className="text-xs text-muted">Válidas</dt>
                <dd className="time text-2xl text-ok">{report.valid.length}</dd>
              </div>
              <div className="rounded-xl bg-signal/10 p-3">
                <dt className="text-xs text-muted">Errores</dt>
                <dd className="time text-2xl text-signal">{report.errors.length}</dd>
              </div>
            </dl>
            {report.errors.length > 0 && (
              <>
                <h4 className="mt-5 font-semibold">Errores (corríjalos y vuelva a validar)</h4>
                <div className="table-wrap mt-2 max-h-72">
                  <table className="data-table !min-w-[28rem]">
                    <thead>
                      <tr>
                        <th scope="col">Línea</th>
                        <th scope="col">Columna</th>
                        <th scope="col">Problema</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="time">{e.line}</td>
                          <td className="text-muted">{e.column ?? "—"}</td>
                          <td>{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {report.warnings.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                {report.warnings.map((w, i) => (
                  <li key={i}>
                    Línea {w.line}: {w.message}
                  </li>
                ))}
              </ul>
            )}
            {report.errors.length === 0 && report.valid.length > 0 && (
              <button
                type="button"
                className="btn btn-primary mt-5"
                onClick={() => {
                  const b = importResults(fileName, report);
                  setDone(`${b.rows} resultados importados como pendientes de revisión (lote ${b.id}). Aún no son públicos.`);
                  setReport(null);
                  setText("");
                }}
              >
                Importar {report.valid.length} filas como pendientes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- marcas mínimas
function StandardsTab() {
  const { data, ix, saveStandard, deleteStandard } = useData();
  const [compId, setCompId] = useState(data.competitions.find((c) => data.standards.some((s) => s.competitionId === c.id))?.id ?? data.competitions[0].id);
  const comp = ix.comp.get(compId)!;
  const [form, setForm] = useState({ categoryId: comp.categories[0] as CategoryId, gender: "F" as Gender, ev: "100-LIBRE", time: "" });
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const list = data.standards.filter((s) => s.competitionId === compId).sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.gender.localeCompare(b.gender) || a.stroke.localeCompare(b.stroke) || a.distance - b.distance);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const [d, st] = form.ev.split("-");
    let timeMs: number;
    try {
      timeMs = parseTime(form.time);
    } catch (err) {
      return setMsg({ tone: "error", text: err instanceof TimeFormatError ? err.message : "Tiempo no válido." });
    }
    if (!comp.categories.includes(form.categoryId)) return setMsg({ tone: "error", text: "La categoría no está en esta competencia." });
    const id = `mm-${comp.id}-${form.categoryId}-${form.gender}-${d}-${st}`;
    const existing = data.standards.find((s) => s.id === id);
    const s: QualifyingStandard = { id, competitionId: comp.id, categoryId: form.categoryId, gender: form.gender, distance: Number(d), stroke: st as Stroke, course: comp.course, timeMs, synthetic: true, published: false };
    saveStandard(s);
    setMsg({ tone: "ok", text: `${existing ? "Marca actualizada" : "Marca registrada"} como borrador: ${eventLabel(s.distance, s.stroke)} ${s.gender} ${s.categoryId}. Publíquela en «Revisión y publicación».` });
    setForm({ ...form, time: "" });
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <form onSubmit={submit} noValidate className="panel h-fit space-y-4 p-5" aria-label="Registrar marca mínima">
        <h3 className="h-card">Registrar marca mínima</h3>
        <Field label="Competencia" htmlFor="as-comp">
          <select id="as-comp" className="field" value={compId} onChange={(e) => (setCompId(e.target.value), setForm({ ...form, categoryId: ix.comp.get(e.target.value)!.categories[0] }), setMsg(null))}>
            {data.competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="as-cat">
            <select id="as-cat" className="field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value as CategoryId })}>
              {comp.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Rama" htmlFor="as-gen">
            <select id="as-gen" className="field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
              <option value="F">{GENDERS.F}</option>
              <option value="M">{GENDERS.M}</option>
            </select>
          </Field>
          <Field label="Prueba" htmlFor="as-ev">
            <select id="as-ev" className="field" value={form.ev} onChange={(e) => setForm({ ...form, ev: e.target.value })}>
              {ALL_EVENTS.map(([d, s]) => (
                <option key={`${d}-${s}`} value={`${d}-${s}`}>
                  {d} m {STROKES[s].toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Piscina" htmlFor="as-course" hint="La de la competencia: no se registran marcas de otra longitud.">
            <input id="as-course" className="field" value={COURSES[comp.course].long} readOnly />
          </Field>
        </div>
        <Field label="Tiempo" htmlFor="as-time" hint="m:ss.cc o ss.cc">
          <input id="as-time" className="field time" inputMode="decimal" placeholder="1:02.00" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn-primary">
          Registrar marca
        </button>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      </form>
      <div className="min-w-0">
        <p className="text-sm text-muted">
          {list.length} marcas para {comp.name}. <DemoTag>Ficticias</DemoTag>
        </p>
        <div className="table-wrap mt-2 max-h-[32rem]">
          <table className="data-table !min-w-[30rem]">
            <thead>
              <tr>
                <th scope="col">Prueba</th>
                <th scope="col">Rama</th>
                <th scope="col">Cat.</th>
                <th scope="col">Marca</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{eventLabel(s.distance, s.stroke)}</td>
                  <td>{s.gender}</td>
                  <td>{s.categoryId}</td>
                  <td>
                    <Time ms={s.timeMs} />
                  </td>
                  <td>{s.published ? <span className="text-ok">Publicada</span> : <span className="text-muted">Borrador</span>}</td>
                  <td className="text-right">
                    <button type="button" className="text-sm font-semibold text-signal hover:underline" onClick={() => deleteStandard(s.id)} aria-label={`Eliminar marca ${eventLabel(s.distance, s.stroke)} ${s.gender} ${s.categoryId}`}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    Sin marcas mínimas para esta competencia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- perfiles ficticios
function ProfilesTab() {
  const { data, ix, saveSwimmer } = useData();
  const empty = { id: "", firstName: "", lastName: "", gender: "F" as Gender, birthYear: 2013, clubId: data.clubs[0].id };
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const thisYear = Number(new Date().getFullYear());
  const list = data.swimmers.filter((s) => !q || fullName(s).toLowerCase().includes(q.toLowerCase())).slice(0, 30);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fn = form.firstName.trim();
    const ln = form.lastName.trim();
    if (fn.length < 2 || ln.length < 2) return setMsg({ tone: "error", text: "Escriba nombre y apellido ficticios (mínimo 2 letras cada uno)." });
    if (!Number.isInteger(form.birthYear) || form.birthYear < thisYear - 80 || form.birthYear > thisYear - 6) return setMsg({ tone: "error", text: `El año de nacimiento debe estar entre ${thisYear - 80} y ${thisYear - 6}.` });
    let id = form.id;
    if (!id) {
      id = slugify(`${fn} ${ln}`);
      let n = 2;
      while (ix.swimmer.has(id)) id = `${slugify(`${fn} ${ln}`)}-${n++}`;
    }
    const prev = ix.swimmer.get(id);
    const s: Swimmer = { id, firstName: fn, lastName: ln, gender: form.gender, birthYear: form.birthYear, clubId: form.clubId, synthetic: true, published: prev?.published ?? false };
    saveSwimmer(s);
    setMsg({ tone: "ok", text: prev ? `Perfil de ${fullName(s)} actualizado.` : `Perfil ficticio de ${fullName(s)} creado como borrador.` });
    setForm(empty);
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} noValidate className="panel h-fit space-y-4 p-5" aria-label="Perfil ficticio">
        <h3 className="h-card">{form.id ? "Editar perfil ficticio" : "Nuevo perfil ficticio"}</h3>
        <p className="text-sm text-muted">Use solo identidades inventadas. Se guarda el año de nacimiento (no la fecha) para calcular la categoría, y no se muestra.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="ap-fn">
            <input id="ap-fn" className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Apellidos" htmlFor="ap-ln">
            <input id="ap-ln" className="field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Rama" htmlFor="ap-g">
            <select id="ap-g" className="field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
              <option value="F">{GENDERS.F}</option>
              <option value="M">{GENDERS.M}</option>
            </select>
          </Field>
          <Field label="Año de nacimiento" htmlFor="ap-y">
            <input id="ap-y" type="number" inputMode="numeric" className="field" value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Club" htmlFor="ap-club">
              <select id="ap-club" className="field" value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
                {data.clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            {form.id ? "Guardar perfil" : "Crear perfil"}
          </button>
          {form.id && (
            <button type="button" className="btn btn-ghost" onClick={() => setForm(empty)}>
              Cancelar
            </button>
          )}
        </div>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      </form>
      <div className="min-w-0">
        <Field label="Buscar perfil" htmlFor="ap-q">
          <input id="ap-q" type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {list.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{fullName(s)}</span> <span className="text-muted">· {ix.club.get(s.clubId)?.shortName}</span>
                {!s.published && <span className="ml-2 text-xs text-muted">(borrador)</span>}
              </span>
              <button
                type="button"
                className="shrink-0 font-semibold text-brand hover:underline"
                onClick={() => setForm({ id: s.id, firstName: s.firstName, lastName: s.lastName, gender: s.gender, birthYear: s.birthYear, clubId: s.clubId })}
                aria-label={`Editar ${fullName(s)}`}
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- revisión
function ReviewTab() {
  const { data, ix, setCompetitionPublished, publishBatch, discardBatch, saveStandard, deleteStandard, saveSwimmer } = useData();
  const comps = data.competitions.filter((c) => !c.published);
  const batches = data.importBatches.filter((b) => b.status === "pendiente");
  const standards = data.standards.filter((s) => !s.published);
  const swimmers = data.swimmers.filter((s) => !s.published);
  const nothing = !comps.length && !batches.length && !standards.length && !swimmers.length;

  const Row = ({ title, detail, onPublish, onDiscard, discardLabel = "Descartar" }: { title: string; detail?: string; onPublish: () => void; onDiscard?: () => void; discardLabel?: string }) => (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {detail && <span className="block text-sm text-muted">{detail}</span>}
      </span>
      <span className="flex gap-2">
        <button type="button" className="btn btn-primary !min-h-[38px] !px-4" onClick={onPublish} aria-label={`Publicar ${title}`}>
          Publicar
        </button>
        {onDiscard && (
          <button type="button" className="btn btn-danger !min-h-[38px] !px-4" onClick={onDiscard} aria-label={`${discardLabel} ${title}`}>
            {discardLabel}
          </button>
        )}
      </span>
    </li>
  );

  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm text-muted">Nada se muestra en las secciones públicas hasta que se publica aquí. «Publicar» solo afecta a este navegador.</p>
      {nothing && <p className="panel p-6 text-muted">No hay registros pendientes de revisión.</p>}
      {batches.length > 0 && (
        <section aria-labelledby="rv-lotes">
          <h3 id="rv-lotes" className="h-card">
            Resultados importados
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {batches.map((b) => (
              <Row
                key={b.id}
                title={`${b.fileName} (${b.rows} filas)`}
                detail={`${b.competitionIds.map((id) => ix.comp.get(id)?.name).join(", ")} · validado el ${formatDate(b.createdAt.slice(0, 10))}`}
                onPublish={() => publishBatch(b.id)}
                onDiscard={() => discardBatch(b.id)}
              />
            ))}
          </ul>
        </section>
      )}
      {comps.length > 0 && (
        <section aria-labelledby="rv-comps">
          <h3 id="rv-comps" className="h-card">
            Competencias en borrador
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {comps.map((c) => (
              <Row key={c.id} title={c.name} detail={`${formatRange(c.startDate, c.endDate)} · ${COURSES[c.course].long}`} onPublish={() => setCompetitionPublished(c.id, true)} />
            ))}
          </ul>
        </section>
      )}
      {standards.length > 0 && (
        <section aria-labelledby="rv-std">
          <h3 id="rv-std" className="h-card">
            Marcas mínimas en borrador
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {standards.map((s) => (
              <Row
                key={s.id}
                title={`${eventLabel(s.distance, s.stroke)} ${s.gender} ${s.categoryId}`}
                detail={`${ix.comp.get(s.competitionId)?.name} · ${COURSES[s.course].short}`}
                onPublish={() => saveStandard({ ...s, published: true })}
                onDiscard={() => deleteStandard(s.id)}
              />
            ))}
          </ul>
        </section>
      )}
      {swimmers.length > 0 && (
        <section aria-labelledby="rv-sw">
          <h3 id="rv-sw" className="h-card">
            Perfiles en borrador
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {swimmers.map((s) => (
              <Row key={s.id} title={fullName(s)} detail={ix.club.get(s.clubId)?.name} onPublish={() => saveSwimmer({ ...s, published: true })} />
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="rv-hist">
        <h3 id="rv-hist" className="h-card">
          Historial de importaciones
        </h3>
        {data.importBatches.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aún no se ha importado ningún archivo.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {data.importBatches.map((b) => (
              <li key={b.id}>
                {b.fileName}: {b.rows} filas · <span className={b.status === "publicado" ? "text-ok" : "text-muted"}>{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------- página
export default function Admin() {
  usePageMeta("Administración demostrativa");
  const { data, persistent, reset } = useData();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get("seccion"))?.id ?? "competencias") as Tab;
  const [confirm, setConfirm] = useState(false);
  const [restored, setRestored] = useState(false);
  const pending = useMemo(
    () => data.competitions.filter((c) => !c.published).length + data.importBatches.filter((b) => b.status === "pendiente").length + data.standards.filter((s) => !s.published).length + data.swimmers.filter((s) => !s.published).length,
    [data],
  );
  const go = (id: Tab) => setParams({ seccion: id }, { replace: true });

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="wrap py-8" data-tour="admin">
          <h1 className="h-page">Administración demostrativa</h1>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm">
              <ShieldOff className="h-5 w-5 shrink-0 text-signal" aria-hidden="true" />
              <p>
                <strong>Sin autenticación.</strong> Cualquier visitante puede usar esta sección porque es una demostración: no hay usuarios, roles ni seguridad. Un panel real, multiusuario y protegido requiere un backend (segunda fase).
              </p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-line bg-bg p-4 text-sm">
              <Database className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
              <p>
                <strong>Almacenamiento local.</strong>{" "}
                {persistent ? "Los cambios se guardan en este navegador (localStorage)" : "Este navegador no permite guardar: los cambios se pierden al recargar"}. No es un sistema federativo ni se comparten con nadie.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!confirm ? (
              <button type="button" className="btn btn-ghost" onClick={() => (setConfirm(true), setRestored(false))}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restaurar datos demostrativos
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line p-2 pl-4 text-sm" role="group" aria-label="Confirmar restauración">
                <span>Se borrarán todos los cambios hechos en este navegador.</span>
                <button
                  type="button"
                  className="btn btn-danger !min-h-[38px]"
                  onClick={() => {
                    reset();
                    setConfirm(false);
                    setRestored(true);
                  }}
                >
                  Sí, restaurar
                </button>
                <button type="button" className="btn btn-ghost !min-h-[38px]" onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
              </div>
            )}
            {restored && (
              <span role="status" className="text-sm font-semibold text-ok">
                Datos demostrativos restaurados.
              </span>
            )}
          </div>
          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Secciones de administración">
            {TABS.map((t) => (
              <button key={t.id} type="button" className="chip shrink-0" aria-pressed={tab === t.id} onClick={() => go(t.id)}>
                {t.label}
                {t.id === "revision" && pending > 0 && <span className="rounded-full bg-signal px-1.5 text-xs font-bold text-white">{pending}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="wrap py-6">
        {tab === "competencias" && <CompetitionsTab />}
        {tab === "importar" && <ImportTab goReview={() => go("revision")} />}
        {tab === "marcas" && <StandardsTab />}
        {tab === "perfiles" && <ProfilesTab />}
        {tab === "revision" && <ReviewTab />}
        <p className="mt-10 text-sm text-muted">
          ¿Qué datos son reales? Ver{" "}
          <Link className="link" to="/acerca">
            Acerca de la plataforma
          </Link>
          .
        </p>
      </div>
    </>
  );
}

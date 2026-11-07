import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageLoading() {
  return (
    <div className="wrap py-14" role="status" aria-live="polite">
      <div className="skeleton h-10 w-1/2 max-w-md" />
      <div className="skeleton mt-4 h-4 w-1/3 max-w-xs" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-36" />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export function NotFoundState({ title, text, to = "/", cta = "Ir al inicio" }: { title: string; text: string; to?: string; cta?: string }) {
  return (
    <div className="wrap py-20">
      <h1 className="h-page">{title}</h1>
      <p className="mt-3 max-w-prose text-muted">{text}</p>
      <Link to={to} className="btn btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error de interfaz:", error, info.componentStack);
  }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
    return (
      <div className="wrap py-20" role="alert">
        <h1 className="h-page">{chunk ? "No se pudo cargar esta sección" : "Esta sección tuvo un problema"}</h1>
        <p className="mt-3 max-w-prose text-muted">
          {chunk
            ? "Revise la conexión y recargue la página. Si la demo se actualizó mientras navegaba, recargar descarga la versión nueva."
            : "Recargue la página. Si continúa, use «Restaurar datos demostrativos» en Administración."}
        </p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>
          Recargar la página
        </button>
      </div>
    );
  }
}

import { NotFoundState } from "../components/States";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Página no encontrada");
  return <NotFoundState title="Fuera del carril" text="Esta página no existe. Vuelva al inicio o use el menú para seguir navegando." />;
}

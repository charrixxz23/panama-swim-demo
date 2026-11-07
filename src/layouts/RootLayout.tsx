import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ErrorBoundary, PageLoading } from "../components/States";
import { TourProvider } from "../components/Tour";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) return el.scrollIntoView();
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function RootLayout() {
  const { pathname } = useLocation();
  return (
    <TourProvider>
      <ScrollManager />
      <a href="#contenido" className="sr-only z-50 rounded-full bg-pool px-4 py-2 font-semibold text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </TourProvider>
  );
}

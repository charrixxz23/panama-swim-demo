import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DataProvider } from "./hooks/useData";
import { RootLayout } from "./layouts/RootLayout";
import Home from "./pages/Home";

const Calendar = lazy(() => import("./pages/Calendar"));
const CompetitionPage = lazy(() => import("./pages/CompetitionPage"));
const Results = lazy(() => import("./pages/Results"));
const Swimmers = lazy(() => import("./pages/Swimmers"));
const SwimmerPage = lazy(() => import("./pages/SwimmerPage"));
const Standards = lazy(() => import("./pages/Standards"));
const Clubs = lazy(() => import("./pages/Clubs"));
const ClubPage = lazy(() => import("./pages/ClubPage"));
const Coach = lazy(() => import("./pages/Coach"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

// BASE_URL = "/panama-swim-demo/" en GitHub Pages. Las rutas internas funcionan al recargar gracias a 404.html.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "calendario", element: <Calendar /> },
        { path: "competencias/:id", element: <CompetitionPage /> },
        { path: "resultados", element: <Results /> },
        { path: "nadadores", element: <Swimmers /> },
        { path: "nadadores/:id", element: <SwimmerPage /> },
        { path: "marcas-minimas", element: <Standards /> },
        { path: "clubes", element: <Clubs /> },
        { path: "clubes/:id", element: <ClubPage /> },
        { path: "entrenador", element: <Coach /> },
        { path: "admin", element: <Admin /> },
        { path: "acerca", element: <About /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename },
);

export function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  );
}

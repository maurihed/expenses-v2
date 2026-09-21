import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import MobileLayout from "./components/layouts/mobile-layout";
import { applyTheme, resolveTheme, THEME_STORAGE_KEY } from "./lib/theme";
import BakeryPage from "./pages/bakery/BakeryPage";
import AccountsPage from "./pages/expenses/AccountsPage";
import CategoriesPage from "./pages/expenses/CategoriesPage";
import DebtsPage from "./pages/expenses/DebtsPage";
import HomePage from "./pages/expenses/HomePage";
import InvestmentDetailPage from "./pages/expenses/InvestmentDetailPage";
import MorePage from "./pages/expenses/MorePage";
import MovementsPage from "./pages/expenses/MovementsPage";
import PersonsPage from "./pages/expenses/PersonsPage";
import RecurringPage from "./pages/expenses/RecurringPage";

function App() {
  useEffect(() => {
    // Preferencia guardada > preferencia del sistema. Antes se forzaba dark
    // cuando no había preferencia, ignorando el modo claro del dispositivo.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(resolveTheme(localStorage.getItem(THEME_STORAGE_KEY), media.matches));

    // Si el usuario no ha elegido explícitamente, seguir los cambios del SO.
    const handleChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      applyTheme(resolveTheme(null, event.matches));
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movimientos" element={<MovementsPage />} />
            <Route path="/cuentas" element={<AccountsPage />} />
            <Route path="/cuentas/:id" element={<InvestmentDetailPage />} />
            <Route path="/mas" element={<MorePage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
            <Route path="/recurrentes" element={<RecurringPage />} />
            <Route path="/deudas" element={<DebtsPage />} />
            <Route path="/personas" element={<PersonsPage />} />
            <Route path="/bakery" element={<BakeryPage />} />
            <Route path="/expenses/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

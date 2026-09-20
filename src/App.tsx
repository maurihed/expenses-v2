import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import MobileLayout from "./components/layouts/mobile-layout";
import BakeryPage from "./pages/bakery/BakeryPage";
import AccountsPage from "./pages/expenses/AccountsPage";
import CategoriesPage from "./pages/expenses/CategoriesPage";
import DebtsPage from "./pages/expenses/DebtsPage";
import HomePage from "./pages/expenses/HomePage";
import MorePage from "./pages/expenses/MorePage";
import MovementsPage from "./pages/expenses/MovementsPage";
import PersonsPage from "./pages/expenses/PersonsPage";
import RecurringPage from "./pages/expenses/RecurringPage";

function App() {
  useEffect(() => {
    // Set the initial theme based on the user's preference
    // Dark-first: si no hay preferencia guardada, se usa el tema oscuro.
    const storedTheme = localStorage.theme;
    document.documentElement.classList.toggle(
      "dark",
      storedTheme ? storedTheme === "dark" : true
    );
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

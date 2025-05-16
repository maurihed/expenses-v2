import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import MobileLayout from "./components/layouts/mobile-layout";
import ExpensesPage from "./pages/expenses/ExpensesPage";
import RoutinesPage from "./pages/routines/RoutinesPage";

function App() {
  useEffect(() => {
    // Set the initial theme based on the user's preference
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/expenses" />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/bakery" element={<div>Bakery</div>} />
            <Route path="/workouts" element={<Navigate to="/workouts/mauricio" />} />
            <Route path="/workouts/:id" element={<RoutinesPage />} />
            <Route path="*" element={<Navigate to="/expenses" />} />
          </Routes>
        </MobileLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

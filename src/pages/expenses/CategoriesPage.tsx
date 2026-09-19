import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import { Archive, ArrowLeft, Plus, Tags } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import CategoryModal from "./components/CategoryModal";
import { useCategories } from "./hooks/useCategories";

function CategoriesPage() {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const { categories, loadingCategories, error, refreshCategories } =
    useCategories(true, includeArchived);
  const openNewCategoryModal = useExpensesStore((state) => state.openNewCategoryModal);
  const openEditCategoryModal = useExpensesStore((state) => state.openEditCategoryModal);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-2 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          aria-label="Volver a Más"
          onClick={() => navigate("/mas")}
        >
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-2xl">Categorías</h1>
      </div>

      <ExpenseSection className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg">Tus categorías</h2>
          <Button className="cursor-pointer" onClick={openNewCategoryModal}>
            <Plus />
            Nueva categoría
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {includeArchived ? "Mostrando archivadas" : "Las archivadas están ocultas"}
          </p>
          <Button
            variant={includeArchived ? "default" : "outline"}
            size="sm"
            className="cursor-pointer"
            aria-pressed={includeArchived}
            onClick={() => setIncludeArchived((value) => !value)}
          >
            <Archive />
            {includeArchived ? "Ocultar archivadas" : "Mostrar archivadas"}
          </Button>
        </div>

        {loadingCategories && <Loader />}

        {!loadingCategories && Boolean(error) && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">Error al cargar categorías</p>
            <Button variant="outline" className="cursor-pointer" onClick={() => refreshCategories()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loadingCategories && !error && categories.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="rounded-full bg-primary-100 p-3">
              <Tags className="text-primary-700" aria-hidden="true" />
            </span>
            <p className="font-display text-lg">Sin categorías</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primera categoría para clasificar tus movimientos.
            </p>
            <Button className="cursor-pointer" onClick={openNewCategoryModal}>
              <Plus />
              Nueva categoría
            </Button>
          </div>
        )}

        {!loadingCategories && !error && categories.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => openEditCategoryModal(category)}
                className={cn(
                  "flex min-w-0 flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow duration-200 cursor-pointer hover:shadow-md",
                  category.archived && "opacity-60"
                )}
              >
                <CategoryIcon
                  category={category.name}
                  icon={category.icon}
                  color={category.color}
                  size="md"
                />
                <span className="w-full truncate font-medium">{category.name}</span>
                {category.archived && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Archivada
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </ExpenseSection>

      <CategoryModal />
    </div>
  );
}

export default CategoriesPage;

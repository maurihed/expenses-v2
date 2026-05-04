import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useRecipes } from "../../hooks/useRecipes";
import RecipeListCard from "./recipe-list-card";

export default function RecipeList() {
  const { recipes, isLoading, error, retry } = useRecipes();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-destructive">Error al cargar recetas</p>
        <Button variant="outline" onClick={() => retry()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!recipes?.length) {
    return <div>No hay ninguna receta</div>;
  }

  return (
    <ul>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeListCard recipe={recipe} />
        </li>
      ))}
    </ul>
  );
}

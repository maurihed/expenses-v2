import { useRecipes } from "../../hooks/useRecipes";
import RecipeListCard from "./recipe-list-card";

export default function RecipeList() {
  const { recipes, isLoading, error } = useRecipes();

  if (isLoading) {
    return <div>Cargando....</div>;
  }

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>;
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

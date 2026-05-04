import type { Recipe } from "@/types";

const { VITE_BAKERY_URL, VITE_BAKERY_VERSION } = import.meta.env;
const RECIPE_URL = `${VITE_BAKERY_URL}/api/${VITE_BAKERY_VERSION ?? "v1"}/recipes`;
class RecipeService {
  async getAll(): Promise<Recipe[]> {
    try {
      const response = await fetch(RECIPE_URL);
      const recipes = await response.json();
      return (recipes ?? []) as Recipe[];
    } catch (error) {
      console.error(error);
      throw new Error("Error al cargar las recetas");
    }
  }
}

export default new RecipeService();

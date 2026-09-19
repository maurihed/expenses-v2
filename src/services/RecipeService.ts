import { parseJsonResponse } from "@/lib/http";
import type { Recipe } from "@/types";

const { VITE_BAKERY_URL, VITE_BAKERY_VERSION } = import.meta.env;
const RECIPE_URL = `${VITE_BAKERY_URL}/api/${VITE_BAKERY_VERSION ?? "v1"}/recipes`;
class RecipeService {
  async getAll(): Promise<Recipe[]> {
    try {
      const response = await fetch(RECIPE_URL);
      const recipes = await parseJsonResponse<Recipe[]>(response);
      return recipes ?? [];
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default new RecipeService();

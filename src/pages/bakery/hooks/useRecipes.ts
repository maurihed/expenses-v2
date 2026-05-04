import RecipeService from "@/services/RecipeService";
import type { Recipe } from "@/types";
import { useQuery } from "react-query";

export const useRecipes = (enabled = true) => {
  const { data, isLoading, error } = useQuery<Recipe[]>("recipes", RecipeService.getAll, {
    staleTime: Infinity, // Disable background fetching
    enabled,
  });

  return {
    recipes: data,
    isLoading,
    error,
  };
};

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  moldeid: string;
  steps: string[];
  ingredients: RecipeIngredient[];
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeIngredient {
  id: string;
  quantity: number;
}

export interface CreateRecipe
  extends Omit<Recipe, "id" | "createdAt" | "updatedAt" | "ingredients"> {
  ingredients: CreateRecipeIngredient[];
}

export type Ingredient = {
  id: string;
  name: string;
  content: number;
  price: number;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export type RecipeType = {
  id: string;
  name: string;
  description: string;
  molde: string;
  ingredients: Ingredient[];
  steps: string[];
}


export type IngredientRequest = Omit<Ingredient, 'unitPrice' | 'name' | 'content' | 'price' | 'unit' | 'unitPrice'>;
export type RecipeRequest = (Omit<RecipeType, 'id' | 'ingredients'>) & { id?: string; ingredients: IngredientRequest[] };

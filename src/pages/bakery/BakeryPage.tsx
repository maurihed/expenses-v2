import { Button } from "@/components/ui/button";
import RecipeList from "./components/recipe-list";

function BakeryPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <Button className="ml-auto" onClick={() => {}}>
        Crear receta
      </Button>
      <RecipeList />
    </div>
  );
}

export default BakeryPage;

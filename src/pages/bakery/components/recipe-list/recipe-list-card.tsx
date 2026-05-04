import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import type { Recipe } from "@/types";

function RecipeListCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card className="py-4 gap-4">
      <CardHeader className="px-4 ">
        <img
          className="w-full rounded-2xl"
          src="https://i.ytimg.com/vi/gYZ-KrDtUco/maxresdefault.jpg"
          alt="cake-thumbnail"
        />
      </CardHeader>
      <CardContent>
        <CardTitle>
          {recipe.name} - {formatMoney(recipe.cost)}
        </CardTitle>
        <CardDescription>{recipe.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        <Button variant="secondary">Editar</Button>
        <Button variant="destructive">Eliminar</Button>
      </CardFooter>
    </Card>
  );
}

export default RecipeListCard;

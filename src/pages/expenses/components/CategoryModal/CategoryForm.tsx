import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import type { Category, CategoryPayload } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCategoryMutations } from "../../hooks/useCategories";

const categoryFormSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre es obligatorio")
    .max(50, "Máximo 50 caracteres"),
  icon: z.string().min(1, "Selecciona un icono"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Selecciona un color"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type Props = {
  category: Category | null;
  onClose: () => void;
  onArchived: () => void;
};

const iconOptions = CATEGORY_ICON_NAMES.filter((name) => Boolean(CATEGORY_ICONS[name]));

function CategoryForm({ category, onClose, onArchived }: Props) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const { createCategory, updateCategory, archiveCategory, categoryMutationLoading } =
    useCategoryMutations();

  const initialIcon =
    category?.icon && CATEGORY_ICONS[category.icon] ? category.icon : DEFAULT_CATEGORY_ICON;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      icon: initialIcon,
      color: category?.color ?? DEFAULT_CATEGORY_COLOR,
    },
  });

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");
  const PreviewIcon = CATEGORY_ICONS[selectedIcon] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];

  function onSubmit(values: CategoryFormValues) {
    const payload: CategoryPayload = {
      name: values.name,
      icon: values.icon,
      color: values.color,
    };

    if (category) {
      updateCategory.mutate({ id: category.id, category: payload }, { onSuccess: () => onClose() });
    } else {
      createCategory.mutate(payload, { onSuccess: () => onClose() });
    }
  }

  const handleArchive = () => {
    if (!category) return;
    archiveCategory.mutate(category.id, { onSuccess: () => onArchived() });
  };

  useEffect(() => {
    form.setFocus("name");
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Mascotas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icono</FormLabel>
              <FormControl>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {iconOptions.map((name) => {
                    const Icon = CATEGORY_ICONS[name];
                    const isSelected = field.value === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-label={name}
                        aria-pressed={isSelected}
                        onClick={() => field.onChange(name)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md border transition-colors duration-200 cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary-100 text-primary-700"
                            : "border-border text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-3">
                  {CATEGORY_COLORS.map((color) => {
                    const isSelected = field.value.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Color ${color}`}
                        aria-pressed={isSelected}
                        onClick={() => field.onChange(color)}
                        style={{ backgroundColor: color }}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full transition-shadow duration-200 cursor-pointer",
                          isSelected
                            ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                            : "hover:opacity-90"
                        )}
                      >
                        {isSelected && <Check size={16} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-sm text-muted-foreground">
          Vista previa:{" "}
          <span
            className="ml-1 inline-flex size-8 items-center justify-center rounded-full align-middle"
            style={{ backgroundColor: selectedColor }}
          >
            <PreviewIcon size={18} className="text-white" />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={onClose}
              disabled={categoryMutationLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={categoryMutationLoading}>
              {categoryMutationLoading && <LoaderCircle className="animate-spin mr-2" />}
              {category ? "Guardar" : "Crear categoría"}
            </Button>
          </div>
          {category &&
            (category.archived ? (
              <p className="text-sm text-muted-foreground">
                Esta categoría está archivada y no aparece en el selector de movimientos.
              </p>
            ) : confirmArchive ? (
              <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
                <p className="text-sm">¿Archivar esta categoría? Dejará de aparecer en la lista.</p>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setConfirmArchive(false)}
                    disabled={archiveCategory.isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={handleArchive}
                    disabled={archiveCategory.isLoading}
                  >
                    {archiveCategory.isLoading && <LoaderCircle className="animate-spin mr-2" />}
                    Sí, archivar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setConfirmArchive(true)}
                disabled={categoryMutationLoading}
              >
                Archivar categoría
              </Button>
            ))}
        </div>
      </form>
    </Form>
  );
}

export default CategoryForm;

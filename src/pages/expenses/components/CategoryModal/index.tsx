import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useExpensesStore } from "@/stores/expenses.store";
import CategoryForm from "./CategoryForm";

function CategoryModal() {
  const isOpen = useExpensesStore((state) => state.categoryModalOpen);
  const categoryToEdit = useExpensesStore((state) => state.categoryToEdit);
  const closeModal = useExpensesStore((state) => state.closeCategoryModal);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DrawerContent aria-describedby="category-modal-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {categoryToEdit ? "Editar categoría" : "Nueva categoría"}
          </DrawerTitle>
          <DrawerDescription id="category-modal-description">
            {categoryToEdit
              ? "Actualiza el nombre, icono o color de la categoría."
              : "Elige un nombre, un icono y un color para tu categoría."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-6">
          {isOpen && (
            <CategoryForm
              category={categoryToEdit}
              onClose={closeModal}
              onArchived={closeModal}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default CategoryModal;

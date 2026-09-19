import CategoryService from "@/services/CategoryService";
import type { Category, CategoryPayload } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useCategories = (enabled = true, includeArchived = false) => {
  const { data, isLoading, error, refetch } = useQuery<Category[]>(
    ["categories", { includeArchived }],
    () => CategoryService.getCategories(includeArchived),
    {
      staleTime: Infinity, // Disable background fetching
      enabled,
    }
  );

  return {
    categories: data || [],
    loadingCategories: isLoading,
    error,
    refreshCategories: refetch,
  };
};

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const invalidateCategories = () => {
    queryClient.invalidateQueries(["categories"]);
  };

  const createCategory = useMutation<Category, Error, CategoryPayload>(
    (category: CategoryPayload) => CategoryService.createCategory(category),
    { onSuccess: invalidateCategories }
  );

  const updateCategory = useMutation<Category, Error, { id: string; category: CategoryPayload }>(
    ({ id, category }: { id: string; category: CategoryPayload }) =>
      CategoryService.updateCategory(id, category),
    { onSuccess: invalidateCategories }
  );

  const archiveCategory = useMutation<void, Error, string>(
    (id: string) => CategoryService.archiveCategory(id),
    { onSuccess: invalidateCategories }
  );

  return {
    createCategory,
    updateCategory,
    archiveCategory,
    categoryMutationLoading:
      createCategory.isLoading || updateCategory.isLoading || archiveCategory.isLoading,
  };
};

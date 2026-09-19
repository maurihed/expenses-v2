import type { Category, CategoryPayload } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const CATEGORIES_URL = `${VITE_API_BASE_URL}/categories`;

class CategoryService {
  public async getCategories(includeArchived = false): Promise<Category[]> {
    try {
      const url = includeArchived ? `${CATEGORIES_URL}?includeArchived=true` : CATEGORIES_URL;
      const response = await fetch(url);
      const categories = await response.json();
      return Promise.resolve(categories);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createCategory(category: CategoryPayload): Promise<Category> {
    try {
      const response = await fetch(CATEGORIES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });
      const newCategory = await response.json();
      return Promise.resolve(newCategory);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateCategory(id: string, category: CategoryPayload): Promise<Category> {
    try {
      const response = await fetch(`${CATEGORIES_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });
      const updatedCategory = await response.json();
      return Promise.resolve(updatedCategory);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async archiveCategory(id: string): Promise<Category> {
    try {
      const response = await fetch(`${CATEGORIES_URL}/${id}`, {
        method: "DELETE",
      });
      const archivedCategory = await response.json();
      return Promise.resolve(archivedCategory);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;

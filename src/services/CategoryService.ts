import { parseJsonResponse } from "@/lib/http";
import type { Category, CategoryPayload } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const CATEGORIES_URL = `${VITE_API_BASE_URL}/categories`;

class CategoryService {
  public async getCategories(includeArchived = false): Promise<Category[]> {
    try {
      const url = includeArchived ? `${CATEGORIES_URL}?includeArchived=true` : CATEGORIES_URL;
      const response = await fetch(url);
      return await parseJsonResponse<Category[]>(response);
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
      return await parseJsonResponse<Category>(response);
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
      return await parseJsonResponse<Category>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async archiveCategory(id: string): Promise<void> {
    try {
      const response = await fetch(`${CATEGORIES_URL}/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;

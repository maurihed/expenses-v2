import { parseJsonResponse } from "@/lib/http";
import type { Person, PersonAdjustmentPayload, PersonPayload, PersonSummary } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const PERSONS_URL = `${VITE_API_BASE_URL}/persons`;

class PersonService {
  public async getPersons(): Promise<Person[]> {
    try {
      const response = await fetch(PERSONS_URL);
      return await parseJsonResponse<Person[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getSummary(id: string): Promise<PersonSummary> {
    try {
      const response = await fetch(`${PERSONS_URL}/${id}/summary`);
      return await parseJsonResponse<PersonSummary>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async addAdjustment(id: string, adjustment: PersonAdjustmentPayload): Promise<void> {
    try {
      const response = await fetch(`${PERSONS_URL}/${id}/adjustments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustment),
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updatePerson(id: string, person: PersonPayload): Promise<Person> {
    try {
      const response = await fetch(`${PERSONS_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(person),
      });
      return await parseJsonResponse<Person>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const personService = new PersonService();
export default personService;

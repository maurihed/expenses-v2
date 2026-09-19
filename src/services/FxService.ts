import { parseJsonResponse } from "@/lib/http";

const { VITE_API_BASE_URL } = import.meta.env;
const FX_URL = `${VITE_API_BASE_URL}/fx`;

export type FxRate = {
  base: string;
  quote: string;
  rate: number;
  fetchedAt: string;
  stale: boolean;
};

class FxService {
  public async getRate(base = "USD", quote = "MXN"): Promise<FxRate> {
    try {
      const params = new URLSearchParams({ base, quote });
      const response = await fetch(`${FX_URL}/rate?${params.toString()}`);
      return await parseJsonResponse<FxRate>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const fxService = new FxService();
export default fxService;

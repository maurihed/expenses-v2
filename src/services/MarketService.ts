import { parseJsonResponse } from "@/lib/http";
import type { MarketQuote, MarketSearchResult } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const MARKET_URL = `${VITE_API_BASE_URL}/market`;

class MarketService {
  public async search(query: string): Promise<MarketSearchResult[]> {
    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`${MARKET_URL}/search?${params.toString()}`);
      return await parseJsonResponse<MarketSearchResult[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getQuote(symbol: string): Promise<MarketQuote> {
    try {
      const params = new URLSearchParams({ symbol });
      const response = await fetch(`${MARKET_URL}/quote?${params.toString()}`);
      return await parseJsonResponse<MarketQuote>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const marketService = new MarketService();
export default marketService;

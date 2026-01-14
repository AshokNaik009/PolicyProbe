import axios from 'axios';
import { QueryResponse, Stats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const policyApi = {
  async query(query: string, limit: number = 5): Promise<QueryResponse> {
    const response = await api.post<QueryResponse>('/policy-query', { query, limit });
    return response.data;
  },

  async getStats(): Promise<Stats> {
    const response = await api.get<Stats>('/stats');
    return response.data;
  },

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};

import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import httpClient from '../api/httpClient';

export interface AxiosBaseQueryArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: unknown;
}

export const axiosBaseQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  { status?: number; data?: unknown }
> = async ({ url, method = 'GET', data, params }) => {
  try {
    const result = await httpClient({ url, method, data, params });
    return { data: result.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data,
      },
    };
  }
};

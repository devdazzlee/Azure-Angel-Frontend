import httpClient from '../api/httpClient';

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormResponse {
  success: boolean;
  message: string;
}

export const supportService = {
  sendContactForm: async (payload: ContactFormPayload): Promise<ContactFormResponse> => {
    const response = await httpClient.post<ContactFormResponse>('/support/contact', payload);
    return response.data;
  },
};


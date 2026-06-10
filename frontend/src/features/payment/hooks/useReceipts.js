import { useMutation, useQuery } from '@tanstack/react-query';
import receiptApi from '../api/receipt.api';

const downloadBlobResponse = (response, fallbackName) => {
  const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
  const disposition = response?.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || fallbackName;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const useCustomerReceipts = (params = {}) =>
  useQuery({
    queryKey: ['customer-receipts', params],
    queryFn: () => receiptApi.listCustomer(params),
  });

export const useCustomerReceipt = ({ receiptId, bookingId }) =>
  useQuery({
    queryKey: ['customer-receipt', receiptId || bookingId],
    queryFn: () => (receiptId ? receiptApi.getCustomer(receiptId) : receiptApi.getCustomerByBooking(bookingId)),
    enabled: Boolean(receiptId || bookingId),
  });

export const useDownloadCustomerReceipt = () =>
  useMutation({
    mutationFn: async ({ receiptId, fallbackName }) => {
      const response = await receiptApi.downloadCustomer(receiptId);
      downloadBlobResponse(response, fallbackName || 'receipt.pdf');
      return response;
    },
  });

export const useAdminReceipts = (params = {}) =>
  useQuery({
    queryKey: ['admin-receipts', params],
    queryFn: () => receiptApi.listAdmin(params),
  });

export const useAdminReceipt = ({ receiptId, paymentId }) =>
  useQuery({
    queryKey: ['admin-receipt', receiptId || paymentId],
    queryFn: () => (receiptId ? receiptApi.getAdmin(receiptId) : receiptApi.getAdminByPayment(paymentId)),
    enabled: Boolean(receiptId || paymentId),
  });

export const useDownloadAdminReceipt = () =>
  useMutation({
    mutationFn: async ({ receiptId, fallbackName }) => {
      const response = await receiptApi.downloadAdmin(receiptId);
      downloadBlobResponse(response, fallbackName || 'receipt.pdf');
      return response;
    },
  });

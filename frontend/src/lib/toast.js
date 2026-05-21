import toast from 'react-hot-toast';

export const appToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  dismiss: (id) => toast.dismiss(id),
};

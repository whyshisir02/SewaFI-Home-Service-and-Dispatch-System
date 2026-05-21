import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '../api/upload.api';

export const useUpload = () =>
  useMutation({
    mutationFn: uploadApi.preview,
  });

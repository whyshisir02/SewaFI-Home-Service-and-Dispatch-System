export const uploadApi = {
  preview: async (file) => ({
    name: file?.name,
    url: file ? URL.createObjectURL(file) : null,
  }),
};

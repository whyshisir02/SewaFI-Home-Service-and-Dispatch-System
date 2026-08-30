export function UploadPreview({ file }) {
  if (!file?.url) return null;
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface p-3">
      <img src={file.url} alt={file.name} loading="lazy" decoding="async" className="max-h-56 w-full rounded-2xl object-cover" />
    </div>
  );
}

export default UploadPreview;

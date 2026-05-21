import { UploadCloud } from 'lucide-react';

export function FileUpload({ label, hint, multiple = false, accept, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <div className="flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border bg-surface-muted px-4 py-6 text-center">
        <UploadCloud className="h-6 w-6 text-primary" />
        <div>
          <p className="font-medium">Upload files</p>
          <p className="text-xs text-muted">{hint || 'PNG, JPG, PDF up to 5MB'}</p>
        </div>
        <input
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          onChange={(event) => onChange?.(multiple ? [...event.target.files] : event.target.files?.[0])}
        />
      </div>
    </label>
  );
}

export default FileUpload;

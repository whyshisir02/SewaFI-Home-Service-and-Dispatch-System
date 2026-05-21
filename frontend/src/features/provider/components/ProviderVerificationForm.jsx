import { Button } from '../../../components/ui/Button/Button';
import { FileUpload } from '../../../components/ui/Input/FileUpload';

export function ProviderVerificationForm({ status }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Current verification status: <span className="font-semibold text-foreground">{status || 'Pending review'}</span></p>
      <FileUpload label="Upload supporting documents" hint="Passport, citizenship, or business documents for admin review." multiple />
      <Button type="button" variant="outline">
        Save verification files
      </Button>
    </div>
  );
}

export default ProviderVerificationForm;

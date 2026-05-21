import { FileUpload } from '../../../components/ui/Input/FileUpload';

export function DocumentUploader(props) {
  return <FileUpload label="Upload document" accept=".pdf,.png,.jpg,.jpeg" {...props} />;
}

export default DocumentUploader;

import { FileUpload } from '../../../components/ui/Input/FileUpload';

export function ImageUploader(props) {
  return <FileUpload label="Upload image" accept="image/*" {...props} />;
}

export default ImageUploader;

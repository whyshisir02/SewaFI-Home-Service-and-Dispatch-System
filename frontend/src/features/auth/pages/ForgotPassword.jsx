import { AuthCard } from '../components/AuthCard';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

function ForgotPassword() {
  return (
    <AuthCard title="Forgot Password?" description="Enter your registered email or phone number and we’ll send you a reset OTP.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}

export default ForgotPassword;

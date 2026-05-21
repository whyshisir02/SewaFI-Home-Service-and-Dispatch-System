import { AuthCard } from '../components/AuthCard';
import { OTPVerificationForm } from '../components/OTPVerificationForm';

function VerifyOtp() {
  return (
    <AuthCard title="Verify Your Account" description="Enter the OTP sent to your registered email or phone number.">
      <OTPVerificationForm />
    </AuthCard>
  );
}

export default VerifyOtp;

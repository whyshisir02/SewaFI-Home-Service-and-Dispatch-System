import { AuthCard } from '../components/AuthCard';
import { ResetOtpForm } from '../components/ResetOtpForm';

function ResetPasswordOtp() {
  return (
    <AuthCard title="Verify Reset OTP" description="Enter the OTP sent to your registered email or phone number.">
      <ResetOtpForm />
    </AuthCard>
  );
}

export default ResetPasswordOtp;

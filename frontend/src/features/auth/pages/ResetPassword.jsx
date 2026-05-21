import { AuthCard } from '../components/AuthCard';
import { ResetPasswordRecoveryForm } from '../components/ResetPasswordRecoveryForm';

function ResetPassword() {
  return (
    <AuthCard title="Create New Password" description="Choose a new password for your SewaFi account.">
      <ResetPasswordRecoveryForm />
    </AuthCard>
  );
}

export default ResetPassword;

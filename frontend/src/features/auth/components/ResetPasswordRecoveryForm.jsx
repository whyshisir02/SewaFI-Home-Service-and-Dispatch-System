import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { useResetPassword } from '../hooks/useResetPassword';

export function ResetPasswordRecoveryForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const resetPasswordMutation = useResetPassword();

  const identifier = useMemo(
    () => location.state?.identifier || searchParams.get('identifier') || '',
    [location.state?.identifier, searchParams]
  );
  const otp = useMemo(
    () => location.state?.otp || searchParams.get('otp') || '',
    [location.state?.otp, searchParams]
  );
  const resetToken = useMemo(
    () => location.state?.resetToken || searchParams.get('resetToken') || '',
    [location.state?.resetToken, searchParams]
  );

  const hasSession = Boolean((identifier && otp) || resetToken);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!hasSession) {
      setErrorMessage('Password reset session expired. Please request a new OTP.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setErrorMessage('');
      await resetPasswordMutation.mutateAsync({
        identifier,
        otp,
        resetToken,
        newPassword,
      });
      appToast.success('Password reset successfully. Please login.');
      navigate(ROUTES.login);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to reset password right now.'));
    }
  };

  if (!hasSession) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          Password reset session expired. Please request a new OTP.
        </p>
        <Button as={Link} to={ROUTES.forgotPassword} className="h-11 w-full rounded-xl">
          Request OTP Again
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <PasswordInput
        id="reset-new-password"
        label="New Password"
        placeholder="Enter your new password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(event) => {
          setNewPassword(event.target.value);
          if (errorMessage) setErrorMessage('');
        }}
      />
      <PasswordInput
        id="reset-confirm-password"
        label="Confirm New Password"
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          if (errorMessage) setErrorMessage('');
        }}
      />
      {errorMessage ? (
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-xl" loading={resetPasswordMutation.isPending}>
        Reset Password
      </Button>
      <p className="text-center text-sm text-[var(--sf-text-muted)]">
        <Link className="font-semibold text-[var(--sf-primary)] hover:underline" to={ROUTES.login}>
          Back to Login
        </Link>
      </p>
    </form>
  );
}

export default ResetPasswordRecoveryForm;

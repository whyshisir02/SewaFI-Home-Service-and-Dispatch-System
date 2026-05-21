import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useForgotPassword } from '../hooks/useForgotPassword';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = async (event) => {
    event.preventDefault();
    const normalized = identifier.trim();
    if (!normalized) {
      setErrorMessage('Enter your email or phone number.');
      return;
    }

    try {
      setErrorMessage('');
      await forgotPasswordMutation.mutateAsync({ identifier: normalized });
      appToast.success('Reset OTP sent successfully.');
      navigate(`${ROUTES.resetPasswordVerifyOtp}?identifier=${encodeURIComponent(normalized)}`, {
        state: { identifier: normalized },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to send reset OTP right now.'));
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Email or Phone Number"
        value={identifier}
        onChange={(event) => {
          setIdentifier(event.target.value);
          if (errorMessage) setErrorMessage('');
        }}
        placeholder="Enter your email or phone number"
        error={errorMessage}
      />
      <Button type="submit" className="h-11 w-full rounded-xl" loading={forgotPasswordMutation.isPending}>
        Send Reset OTP
      </Button>
      <p className="text-center text-sm text-[var(--sf-text-muted)]">
        <Link className="font-semibold text-[var(--sf-primary)] hover:underline" to={ROUTES.login}>
          Back to Login
        </Link>
      </p>
    </form>
  );
}

export default ForgotPasswordForm;

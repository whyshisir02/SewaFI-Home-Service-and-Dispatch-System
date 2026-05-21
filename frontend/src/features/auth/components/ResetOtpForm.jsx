import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { OTPInput } from '../../../components/ui/Input/OTPInput';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useResendOtp } from '../hooks/useResendOtp';

const RESEND_COOLDOWN_SECONDS = 30;

export function ResetOtpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const resendOtpMutation = useResendOtp();

  const identifier = useMemo(
    () => location.state?.identifier || searchParams.get('identifier') || '',
    [location.state?.identifier, searchParams]
  );

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onVerify = async () => {
    if (!identifier) {
      setErrorMessage('Reset session expired. Please request a new OTP.');
      return;
    }
    if (otp.trim().length < 6) {
      setErrorMessage('Enter the 6-digit OTP.');
      return;
    }
    // Backend contract verifies reset OTP during /auth/reset-password.
    // Keep this step as OTP capture and proceed with the submitted code.
    setErrorMessage('');
    navigate(ROUTES.resetPassword, {
      state: { identifier, otp: otp.trim() },
    });
  };

  const onResend = async () => {
    if (!identifier) {
      setErrorMessage('Reset session expired. Please request a new OTP.');
      return;
    }
    try {
      setErrorMessage('');
      await resendOtpMutation.mutateAsync({ identifier });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      appToast.success('OTP sent again successfully.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to resend OTP right now.'));
    }
  };

  return (
    <div className="space-y-5">
      {identifier ? (
        <p className="text-sm text-[var(--sf-text-muted)]">
          OTP sent to <span className="font-semibold text-[var(--sf-text-main)]">{identifier}</span>
        </p>
      ) : (
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          Password reset session expired. Please request a new OTP.
        </p>
      )}

      <OTPInput value={otp} onChange={(next) => { setOtp(next); if (errorMessage) setErrorMessage(''); }} />

      {errorMessage ? (
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          {errorMessage}
        </p>
      ) : null}

      <Button type="button" className="h-11 w-full rounded-xl" onClick={onVerify}>
        Verify OTP
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl"
        onClick={onResend}
        loading={resendOtpMutation.isPending}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link className="font-semibold text-[var(--sf-primary)] hover:underline" to={ROUTES.forgotPassword}>
          Back to Forgot Password
        </Link>
        <Link className="font-semibold text-[var(--sf-primary)] hover:underline" to={ROUTES.login}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetOtpForm;

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { OTPInput } from '../../../components/ui/Input/OTPInput';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { useRegister } from '../hooks/useRegister';
import { AUTH_ROLE } from '../constants/auth.constant';
import { ROUTES } from '../../../constants/routes.constant';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { useResendOtp } from '../hooks/useResendOtp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskIdentifier = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  if (text.includes('@')) {
    const [name, domain] = text.split('@');
    if (!name || !domain) return text;
    const visibleName = name.slice(0, 1);
    return `${visibleName}${'*'.repeat(Math.max(name.length - 1, 1))}@${domain}`;
  }

  if (text.length <= 4) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(text.length - 4, 2))}${text.slice(-2)}`;
};

export function OTPVerificationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [verifyStage, setVerifyStage] = useState('idle');
  const role = location.state?.role;
  const formValues = location.state?.formValues;
  const providerFiles = location.state?.providerFiles;
  const redirect = location.state?.redirect;
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp({ purpose: 'registration' });
  const { registerMutation } = useRegister(role);

  const queryEmail = searchParams.get('email');
  const queryIdentifier = searchParams.get('identifier');
  const queryPhone = searchParams.get('phone');
  const queryPurpose = searchParams.get('purpose');

  const identifier = useMemo(
    () => (formValues?.email || queryEmail || queryIdentifier || queryPhone || '').trim(),
    [formValues?.email, queryEmail, queryIdentifier, queryPhone]
  );

  const email = useMemo(() => {
    const candidate = (formValues?.email || queryEmail || queryIdentifier || '').trim().toLowerCase();
    return emailRegex.test(candidate) ? candidate : '';
  }, [formValues?.email, queryEmail, queryIdentifier]);

  const purpose = queryPurpose || 'REGISTRATION';
  const missingSession = !identifier;
  const maskedDestination = maskIdentifier(identifier);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onVerify = async () => {
    setErrorMessage('');
    if (missingSession) {
      setErrorMessage('Verification session not found. Please register again.');
      return;
    }
    if (!email) {
      setErrorMessage('This verification flow currently supports email-based OTP only.');
      return;
    }
    if (otp.trim().length !== OTP_LENGTH) {
      setErrorMessage(`Enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    try {
      setVerifyStage('verifying');
      const verification = await verifyOtpMutation.mutateAsync({ email, otp: otp.trim(), purpose });

      if (formValues && role) {
        setVerifyStage('registering');
        if (role === AUTH_ROLE.PROVIDER) {
          const payload = new FormData();
          Object.entries({
            ...formValues,
            verificationToken: verification.verificationToken,
            email,
            serviceAreas: JSON.stringify([
              {
                province: formValues.province,
                district: formValues.district,
                municipality: formValues.municipality,
              },
            ]),
            subCategoryIds: JSON.stringify([]),
          }).forEach(([key, value]) => payload.append(key, value ?? ''));
          if (providerFiles?.citizenshipFront) payload.append('citizenshipFront', providerFiles.citizenshipFront);
          if (providerFiles?.citizenshipBack) payload.append('citizenshipBack', providerFiles.citizenshipBack);
          await registerMutation.mutateAsync(payload);
          appToast.success('Account verified. Provider profile may require admin approval before receiving jobs.');
        } else {
          await registerMutation.mutateAsync({
            ...formValues,
            verificationToken: verification.verificationToken,
          });
          appToast.success('Registration complete. You can now sign in.');
        }

        navigate(redirect || ROUTES.login);
        setVerifyStage('idle');
        return;
      }

      appToast.success('Account verified. Please login.');
      setVerifyStage('idle');
      navigate(ROUTES.login);
    } catch (error) {
      const timeoutMessage = String(error?.message || '').toLowerCase().includes('timeout');
      const message = timeoutMessage && verifyStage === 'registering'
        ? 'Registration is taking too long. Please try again.'
        : getErrorMessage(error, 'Unable to verify OTP right now. Please try again.');
      setErrorMessage(message);
      appToast.error(message);
    } finally {
      setVerifyStage('idle');
    }
  };

  const onResendOtp = async () => {
    if (cooldown > 0) return;
    if (missingSession) {
      setErrorMessage('Verification session not found. Please register again.');
      return;
    }
    if (!email) {
      setErrorMessage('This verification flow currently supports email-based OTP only.');
      return;
    }

    setErrorMessage('');
    try {
      await resendOtpMutation.mutateAsync({ email, purpose });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      appToast.success('OTP sent successfully.');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to resend OTP right now.');
      setErrorMessage(message);
      appToast.error(message);
    }
  };

  if (missingSession) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          Verification session not found.
        </p>
        <p className="text-sm text-[var(--sf-text-muted)]">Please register again or request a new OTP.</p>
        <Button as={Link} to={ROUTES.register} className="w-full">
          Go to Register
        </Button>
        <Button as={Link} to={ROUTES.login} variant="outline" className="w-full">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {maskedDestination ? (
        <p className="text-sm text-[var(--sf-text-muted)]">
          We sent a code to <span className="font-semibold text-[var(--sf-text-main)]">{maskedDestination}</span>
        </p>
      ) : null}
      <OTPInput
        length={OTP_LENGTH}
        value={otp}
        disabled={verifyOtpMutation.isPending || registerMutation.isPending}
        ariaLabel={`Enter ${OTP_LENGTH}-digit OTP`}
        onChange={(next) => {
          setOtp(next);
          if (errorMessage) setErrorMessage('');
        }}
      />
      {errorMessage ? (
        <p className="rounded-xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 px-3 py-2 text-sm text-[var(--sf-danger)]">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        onClick={onVerify}
        loading={verifyOtpMutation.isPending || registerMutation.isPending}
        disabled={verifyOtpMutation.isPending || registerMutation.isPending}
      >
        {verifyOtpMutation.isPending || registerMutation.isPending
          ? verifyStage === 'registering'
            ? 'Completing registration...'
            : 'Verifying...'
          : 'Verify OTP'}
      </Button>

      <div className="space-y-3 text-center">
        <p className="text-sm text-[var(--sf-text-muted)]">Didn&apos;t receive the code?</p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onResendOtp}
          loading={resendOtpMutation.isPending}
          disabled={resendOtpMutation.isPending || cooldown > 0}
        >
          {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => navigate(ROUTES.login)}
      >
        Back to Login
      </Button>
    </div>
  );
}

export default OTPVerificationForm;

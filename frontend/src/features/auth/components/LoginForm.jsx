import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { ROUTES } from '../../../constants/routes.constant';
import { Button } from '../../../components/ui/Button/Button';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { useLogin } from '../hooks/useLogin';
import { getErrorMessage } from '../../../utils/errorHandler';

const getDashboardRoute = (user) => {
  if (user?.role === 'CUSTOMER') return ROUTES.customer.dashboard;
  if (user?.role === 'ADMIN') return ROUTES.admin.dashboard;

  if (user?.role === 'PROVIDER') {
    const status = user?.providerStatus || user?.providerProfile?.status;

    if (status && status !== 'APPROVED') {
      return ROUTES.provider.verification;
    }

    return ROUTES.provider.dashboard;
  }

  return ROUTES.home;
};

const friendlyError = (error) => {
  const status = error?.response?.status;
  const message = getErrorMessage(error, 'Unable to login right now. Please try again.');

  if (status === 401 || String(message).toLowerCase() === 'invalid credentials') return 'Invalid email or password.';
  if (message) return message;
  return 'Unable to login right now. Please try again.';
};

const safeRedirect = (redirect) => (redirect?.startsWith('/') ? redirect : null);

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const canSubmit = useMemo(() => values.email.trim() && values.password && !loginMutation.isPending, [loginMutation.isPending, values]);

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = 'Email is required.';
    if (!values.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      const payload = await loginMutation.mutateAsync({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      const nextUser = payload?.user || payload;
      const redirect =
        safeRedirect(location.state?.from) ||
        safeRedirect(redirectParam) ||
        getDashboardRoute(nextUser);

      navigate(redirect, { replace: true });
    } catch (error) {
      setFormError(friendlyError(error));
    }
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {formError ? (
        <div className="flex gap-3 rounded-2xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 p-4 text-sm text-[var(--sf-danger)]" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="login-email" className="text-sm font-semibold text-[var(--sf-text-main)]">
          Email address
        </label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sf-text-soft)]" aria-hidden="true" />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={updateField('email')}
            disabled={loginMutation.isPending}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            placeholder="Enter your email address"
            className="h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-11 text-sm text-[var(--sf-text-main)] outline-none transition placeholder:text-[var(--sf-text-soft)] focus:border-[var(--sf-secondary)] focus:ring-2 focus:ring-[var(--sf-secondary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
        {errors.email ? (
          <p id="login-email-error" className="mt-2 text-sm font-medium text-[var(--sf-danger)]">
            {errors.email}
          </p>
        ) : null}
      </div>

      <PasswordInput value={values.password} onChange={updateField('password')} error={errors.password} disabled={loginMutation.isPending} />

      <div className="flex items-center justify-end">
        <Link to={ROUTES.forgotPassword} className="text-sm font-semibold text-[var(--sf-secondary)] hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-12 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90"
      >
        {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </Button>

      <div className="space-y-2 text-center text-sm text-[var(--sf-text-muted)]">
        <p>
          New to SewaFi?{' '}
          <Link to={ROUTES.register} className="font-semibold text-[var(--sf-secondary)] hover:underline">
            Create account
          </Link>
        </p>
        <p>
          Joining as a provider?{' '}
          <Link to={`${ROUTES.register}?role=provider`} className="font-semibold text-[var(--sf-secondary)] hover:underline">
            Apply here
          </Link>
        </p>
        <p className="text-xs text-[var(--sf-text-soft)]">Customers, providers, and admins can login from here.</p>
      </div>
    </form>
  );
}

export default LoginForm;

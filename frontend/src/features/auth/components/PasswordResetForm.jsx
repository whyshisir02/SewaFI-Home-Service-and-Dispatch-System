import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { authApi } from '../api/auth.api';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.schema';
import { useMutation } from '@tanstack/react-query';

export function PasswordResetForm({ mode = 'forgot' }) {
  const schema = mode === 'forgot' ? forgotPasswordSchema : resetPasswordSchema;
  const mutation = useMutation({
    mutationFn: mode === 'forgot' ? authApi.forgotPassword : authApi.resetPassword,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      {mode === 'forgot' ? (
        <Input label="Email" error={errors.email?.message} {...register('email')} />
      ) : (
        <>
          <Input label="Reset token" error={errors.token?.message} {...register('token')} />
          <Input label="New password" type="password" error={errors.password?.message} {...register('password')} />
        </>
      )}
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        {mode === 'forgot' ? 'Send reset instructions' : 'Reset password'}
      </Button>
    </form>
  );
}

export default PasswordResetForm;

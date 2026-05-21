import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { PhoneInput } from '../../../components/ui/Input/PhoneInput';
import { Select } from '../../../components/ui/Input/Select';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { FileUpload } from '../../../components/ui/Input/FileUpload';
import { ROUTES } from '../../../constants/routes.constant';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import { registerSchema } from '../validators/auth.schema';
import { useRegister } from '../hooks/useRegister';
import { AUTH_ROLE } from '../constants/auth.constant';

export function RegisterForm({ role = AUTH_ROLE.CUSTOMER }) {
  const navigate = useNavigate();
  const [providerFiles, setProviderFiles] = useState({
    citizenshipFront: null,
    citizenshipBack: null,
  });
  const { data: categories = [] } = useServiceCategories();
  const { sendOtpMutation } = useRegister(role);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      province: '',
      district: '',
      municipality: '',
      ward: '',
      streetAddress: '',
      categoryId: '',
      experienceYears: 0,
      bio: '',
      expertise: '',
      citizenshipNumber: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await sendOtpMutation.mutateAsync(values.email);
    navigate(ROUTES.verifyOtp, {
      state: {
        role,
        formValues: values,
        providerFiles,
      },
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" error={errors.email?.message} {...register('email')} />
        <PhoneInput label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        <Input label="Province" error={errors.province?.message} {...register('province')} />
        <Input label="District" error={errors.district?.message} {...register('district')} />
        <Input label="Municipality / VDC" error={errors.municipality?.message} {...register('municipality')} />
        <Input label="Ward" error={errors.ward?.message} {...register('ward')} />
      </div>
      <Input label="Street address" error={errors.streetAddress?.message} {...register('streetAddress')} />

      {role === AUTH_ROLE.PROVIDER ? (
        <div className="space-y-4">
          <Select
            label="Primary service category"
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
            error={errors.categoryId?.message}
            {...register('categoryId')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Experience years" type="number" {...register('experienceYears')} />
            <Input label="Citizenship number" {...register('citizenshipNumber')} />
          </div>
          <Textarea label="Bio" {...register('bio')} />
          <Textarea label="Expertise" hint="Optional specialties or service focus areas" {...register('expertise')} />
          <FileUpload
            label="Citizenship front"
            hint="Required for verification"
            onChange={(file) => setProviderFiles((prev) => ({ ...prev, citizenshipFront: file }))}
          />
          <FileUpload
            label="Citizenship back"
            hint="Required for verification"
            onChange={(file) => setProviderFiles((prev) => ({ ...prev, citizenshipBack: file }))}
          />
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={sendOtpMutation.isPending}>
        Send OTP
      </Button>
    </form>
  );
}

export default RegisterForm;

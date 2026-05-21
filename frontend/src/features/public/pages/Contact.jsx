import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, ClipboardList, Clock, Headphones, Mail, MapPin, Phone, ShieldCheck, UserCog, UserRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../constants/roles.constant';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Input/Select';
import { Textarea } from '../../../components/ui/Input/Textarea';
import heroImage from '../../../assets/images/hero/hero-services.png';
import { usePublicContactInfo, useSubmitContactMessage } from '../../../hooks/useContactPageData';

const topicOptions = [
  { value: 'BOOKING_SUPPORT', label: 'Booking Support' },
  { value: 'PROVIDER_REGISTRATION', label: 'Provider Registration' },
  { value: 'ACCOUNT_HELP', label: 'Account Help' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'GENERAL_QUESTION', label: 'General Question' },
];

const defaultForm = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  topic: '',
  message: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

function Contact() {
  const { isAuthenticated, user } = useAuth();
  const contactInfoQuery = usePublicContactInfo();
  const submitMutation = useSubmitContactMessage();
  const [formValues, setFormValues] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const contactInfo = contactInfoQuery.data;
  const hasContactInfo = Boolean(contactInfo?.phone || contactInfo?.email || contactInfo?.address || contactInfo?.supportHours);
  const charCount = formValues.message.length;

  const bookingSupportLink = isAuthenticated ? ROUTES.customer.bookings : `${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.customer.bookings)}`;
  const providerSupportLink = user?.role === ROLES.PROVIDER ? ROUTES.provider.dashboard : ROUTES.becomeProvider;
  const accountHelpLink = isAuthenticated ? (user?.role === ROLES.CUSTOMER ? ROUTES.customer.profile : user?.role === ROLES.PROVIDER ? ROUTES.provider.profile : ROUTES.admin.settings) : ROUTES.login;

  const supportItems = useMemo(
    () => [
      {
        title: 'Booking Support',
        description: 'Help with booking status, cancellation, or tracking.',
        icon: ClipboardList,
        to: bookingSupportLink,
      },
      {
        title: 'Provider Support',
        description: 'Help with provider registration, verification, or job dashboard.',
        icon: UserCog,
        to: providerSupportLink,
      },
      {
        title: 'Account Help',
        description: 'Help with login, OTP, password, or profile settings.',
        icon: UserRound,
        to: accountHelpLink,
      },
      {
        title: 'Safety and Trust',
        description: 'Questions about provider workflow, service updates, or platform rules.',
        icon: ShieldCheck,
        to: ROUTES.about,
      },
    ],
    [accountHelpLink, bookingSupportLink, providerSupportLink]
  );

  const setField = (name) => (event) => {
    const value = event.target.value;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formValues.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!formValues.email.trim()) nextErrors.email = 'Email address is required.';
    if (formValues.email.trim() && !emailRegex.test(formValues.email.trim())) nextErrors.email = 'Please enter a valid email address.';
    if (!formValues.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!formValues.topic) nextErrors.topic = 'Please choose a support topic.';
    if (!formValues.message.trim()) nextErrors.message = 'Message is required.';
    if (formValues.message.length > 1000) nextErrors.message = 'Message must be 1000 characters or fewer.';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      await submitMutation.mutateAsync({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim().toLowerCase(),
        phone: formValues.phone.trim(),
        subject: formValues.subject.trim(),
        topic: formValues.topic,
        message: formValues.message.trim(),
      });
      appToast.success('Your message has been sent successfully.');
      setFormValues(defaultForm);
      setFieldErrors({});
    } catch (error) {
      const message =
        error?.code === 'CONTACT_ENDPOINT_MISSING'
          ? 'Contact form submission is currently unavailable.'
          : getErrorMessage(error, 'Unable to send your message right now. Please try again.');
      setFormError(message);
      appToast.error(message);
    }
  };

  const contactCards = [
    contactInfo?.phone
      ? {
          key: 'phone',
          title: 'Call Us',
          value: contactInfo.phone,
          helper: 'For urgent support and booking help',
          icon: Phone,
          href: `tel:${contactInfo.phone}`,
        }
      : null,
    contactInfo?.email
      ? {
          key: 'email',
          title: 'Email Us',
          value: contactInfo.email,
          helper: 'Best for detailed questions and follow-up',
          icon: Mail,
          href: `mailto:${contactInfo.email}`,
        }
      : null,
    contactInfo?.address
      ? {
          key: 'address',
          title: 'Visit Us',
          value: contactInfo.address,
          helper: 'Office location and in-person support',
          icon: MapPin,
        }
      : null,
    contactInfo?.supportHours
      ? {
          key: 'hours',
          title: 'Support Hours',
          value: contactInfo.supportHours,
          helper: 'Response times may vary during peak hours',
          icon: Clock,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-text-main)]">
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-secondary)]">
              Contact SewaFi
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">We&apos;re Here to Help</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)] sm:text-lg">
              Have questions about bookings, provider registration, account access, or support? Send us a message and we&apos;ll help you through the right channel.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]">
              <img src={heroImage} alt="SewaFi support and customer assistance visual" className="h-auto w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {contactInfoQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </div>
          ) : null}

          {!contactInfoQuery.isLoading && contactInfoQuery.isError ? (
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm text-[var(--sf-text-muted)]">
              Contact information is unavailable right now.
            </div>
          ) : null}

          {!contactInfoQuery.isLoading && !contactInfoQuery.isError && !hasContactInfo ? (
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm text-[var(--sf-text-muted)]">
              Contact information is currently unavailable.
            </div>
          ) : null}

          {!contactInfoQuery.isLoading && !contactInfoQuery.isError && contactCards.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {contactCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.key} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-base font-bold">{card.title}</h2>
                    {card.href ? (
                      <a href={card.href} className="mt-2 block text-sm font-semibold text-[var(--sf-primary)] hover:underline">
                        {card.value}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-[var(--sf-text-main)]">{card.value}</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{card.helper}</p>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 xl:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)] sm:p-8">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Send Us a Message</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">Tell us what you need help with and we&apos;ll get back to you.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              {formError ? (
                <div className="rounded-xl border border-[var(--sf-danger)]/40 bg-[var(--sf-danger)]/10 px-4 py-3 text-sm text-[var(--sf-danger)]" role="alert">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" required value={formValues.fullName} onChange={setField('fullName')} error={fieldErrors.fullName} placeholder="Enter your full name" />
                <Input label="Email Address" required type="email" value={formValues.email} onChange={setField('email')} error={fieldErrors.email} placeholder="Enter your email address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone Number (Optional)" value={formValues.phone} onChange={setField('phone')} error={fieldErrors.phone} placeholder="Enter phone number" />
                <Select label="Support Topic" value={formValues.topic} onChange={setField('topic')} error={fieldErrors.topic} options={topicOptions} placeholder="Choose a support topic" />
              </div>
              <Input label="Subject" required value={formValues.subject} onChange={setField('subject')} error={fieldErrors.subject} placeholder="Write a short subject" />
              <Textarea
                label="Message"
                required
                maxLength={1000}
                value={formValues.message}
                onChange={setField('message')}
                error={fieldErrors.message}
                hint={`${charCount}/1000`}
                placeholder="Describe your issue or question"
              />
              <Button
                type="submit"
                loading={submitMutation.isPending}
                disabled={submitMutation.isPending}
                className="h-12 w-full rounded-xl bg-[var(--sf-secondary)] text-white hover:bg-[var(--sf-secondary)]/90"
              >
                {submitMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
              <p className="text-xs text-[var(--sf-text-muted)]">
                If sending fails, please retry later or contact us through the available channels above.
              </p>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
                <h3 className="text-lg font-bold">Support Center</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">Find the right help based on what you&apos;re trying to do.</p>
              <div className="mt-4 space-y-3">
                {supportItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} to={item.to} className="block rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 transition hover:border-[var(--sf-secondary)]">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{item.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {contactInfo?.socialLinks?.length ? (
              <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                <h3 className="text-base font-bold">Follow SewaFi</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {contactInfo.socialLinks.map((social) => {
                    const url = normalizeUrl(social.url);
                    if (!url) return null;
                    return (
                      <a
                        key={`${social.label}-${url}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--sf-text-main)] transition hover:border-[var(--sf-secondary)]"
                      >
                        {social.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="pb-14 pt-12 sm:pb-16 sm:pt-14 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <BellRing className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Need help with an active booking?</h2>
            </div>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">
              If you already have a booking, the fastest way to check updates is from your booking tracking page.
            </p>
            <Button as={Link} to={bookingSupportLink} className="mt-6 h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
              View My Bookings
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;

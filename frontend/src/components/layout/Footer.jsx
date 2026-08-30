import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config';
import { ROUTES } from '../../constants/routes.constant';
import { useSiteSettings } from '../../features/public/hooks/useHomePageData';
import patternUrl from '../../assets/images/patterns/nepali-pattern.svg';
import { logoAssets } from '../../assets/logos';
import { Container } from '../ui/Layout/Container';

const bookingPath = ROUTES.customer.book.replace(':serviceId', 'new');

const footerGroups = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', to: ROUTES.home },
      { label: 'Services', to: ROUTES.services },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Become a Provider', to: `${ROUTES.register}?role=provider` },
      { label: 'About Us', to: ROUTES.about },
      { label: 'Contact', to: ROUTES.contact },
    ],
  },
  {
    title: 'For Customers',
    links: [
      { label: 'Book a Service', to: bookingPath },
      { label: 'Track Booking', to: ROUTES.customer.bookings },
      { label: 'Login', to: ROUTES.login },
      { label: 'Register', to: ROUTES.register },
    ],
  },
  {
    title: 'For Providers',
    links: [
      { label: 'Become a Provider', to: `${ROUTES.register}?role=provider` },
      { label: 'Provider Login', to: ROUTES.login },
      { label: 'Provider Dashboard', to: ROUTES.provider.dashboard },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: ROUTES.contact },
      { label: 'Help', to: ROUTES.contact },
      { label: 'Terms', to: ROUTES.terms },
      { label: 'Privacy', to: ROUTES.privacy },
    ],
  },
];

function FooterLink({ item }) {
  if (item.href) {
    return (
      <a href={item.href} className="transition hover:text-white">
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.to} className="transition hover:text-white">
      {item.label}
    </Link>
  );
}

export function Footer() {
  const { data: settings = {} } = useSiteSettings();
  const contactItems = [
    settings.address ? { label: settings.address, icon: MapPin } : null,
    settings.phone ? { label: settings.phone, href: `tel:${settings.phone}`, icon: Phone } : null,
    settings.email ? { label: settings.email, href: `mailto:${settings.email}`, icon: Mail } : null,
  ].filter(Boolean);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#06172A] text-slate-100">
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${patternUrl})`, backgroundSize: '320px' }} />
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
      <Container className="relative py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
          <div className="space-y-5">
            <Link to={ROUTES.home} className="inline-flex items-center gap-3">
              <img src={logoAssets.logoFooterWhite} alt={`${APP_CONFIG.name} logo`} className="h-10 w-auto object-contain" decoding="async" />
              <div>
                <p className="font-display text-2xl text-white">{APP_CONFIG.name}</p>
                <p className="text-sm text-teal-100">Built for Nepal</p>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-7 text-slate-300">
              Nepal-focused home service booking and dispatch platform.
            </p>
            {contactItems.length ? (
              <div className="space-y-3 text-sm text-slate-300">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                      <span>{item.label}</span>
                    </>
                  );

                  return item.href ? (
                    <a key={item.label} href={item.href} className="flex items-start gap-3 transition hover:text-white">
                      {content}
                    </a>
                  ) : (
                    <div key={item.label} className="flex items-start gap-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100">{group.title}</h3>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                {group.links.map((item) => (
                  <div key={item.label}>
                    <FooterLink item={item} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} SewaFi. All rights reserved.</p>
          <p>Built for local homes, providers, and dispatch-ready operations.</p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;

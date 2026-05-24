import { Container } from '../../../components/ui/Layout/Container';
import LegalArticle from '../../../components/legal/LegalArticle';
import LegalContactCard from '../../../components/legal/LegalContactCard';
import LegalHero from '../../../components/legal/LegalHero';
import LegalNotice from '../../../components/legal/LegalNotice';
import TableOfContents from '../../../components/legal/TableOfContents';
import { useLegalContent, usePublicSiteSettings } from '../../../hooks/useLegalContent';

const LAST_UPDATED = 'May 13, 2026';

const draftSections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    paragraphs: ['This Privacy Policy describes how SewaFi handles account, booking, and service-related information.'],
  },
  {
    id: 'information-collect',
    title: '2. Information We Collect',
    items: [
      'Account and profile information',
      'Contact details',
      'Booking details and service instructions',
      'Address/location details needed for booking and dispatch',
      'Provider profile details',
      'Uploaded images/documents where features exist',
      'Technical usage data where collected by the application',
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Information',
    items: [
      'Account creation and login',
      'OTP verification',
      'Booking creation, tracking, and assignment workflow',
      'Provider dispatch and job management',
      'Role-based dashboard operations',
      'Support, safety, and service quality handling',
    ],
  },
  {
    id: 'location-information',
    title: '4. Location Information',
    paragraphs: ['Customer location and address details may be used for booking fulfillment and provider dispatch operations.'],
  },
  {
    id: 'provider-information',
    title: '5. Provider Information',
    paragraphs: ['Provider profile, service area, and availability data may be used for dispatch matching and verification workflows.'],
  },
  {
    id: 'notifications-emails',
    title: '6. Notifications and Emails',
    paragraphs: ['Email is used mainly for account verification and password recovery workflows.'],
  },
  {
    id: 'data-sharing',
    title: '7. Data Sharing',
    paragraphs: ['Information may be shared between customer, provider, and admin contexts only as required for booking workflow, support, safety, and operations.'],
  },
  {
    id: 'data-security',
    title: '8. Data Security',
    paragraphs: ['SewaFi uses reasonable technical and operational safeguards, but no system can be guaranteed perfectly secure.'],
  },
  {
    id: 'user-choices',
    title: '9. User Choices',
    paragraphs: ['Users may update profile information through supported account features.'],
  },
  {
    id: 'retention',
    title: '10. Data Retention',
    paragraphs: ['Data may be retained as needed for service delivery, operations, safety, dispute handling, and legal obligations.'],
  },
  {
    id: 'changes-policy',
    title: '11. Changes to Policy',
    paragraphs: ['This policy may be updated as product or legal requirements evolve.'],
  },
  {
    id: 'contact',
    title: '12. Contact',
    paragraphs: ['If support contact details are available in public settings, they are shown below.'],
  },
];

const parseBackendPrivacy = (content) => {
  if (!content) return draftSections;
  return [
    {
      id: 'policy',
      title: 'Privacy Policy',
      paragraphs: String(content)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    },
  ];
};

function PrivacyPage() {
  const legalQuery = useLegalContent('privacy');
  const settingsQuery = usePublicSiteSettings();

  const sections = parseBackendPrivacy(legalQuery.data?.content);
  const tocItems = sections.map((section) => ({ id: section.id, title: section.title }));
  const lastUpdated = legalQuery.data?.lastUpdated || LAST_UPDATED;
  const showDraftNotice = !legalQuery.data?.content;

  return (
    <div className="bg-[var(--sf-bg)] pb-14 text-[var(--sf-text-main)] sm:pb-16 lg:pb-20">
      <LegalHero
        title={legalQuery.data?.title || 'Privacy Policy'}
        subtitle="Learn how SewaFi handles account, booking, and service-related information."
        lastUpdated={lastUpdated}
      />

      {showDraftNotice ? (
        <LegalNotice text="Draft policy - review before production use. This page should be reviewed by a qualified legal professional before production use." />
      ) : null}

      <section className="pt-6">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <TableOfContents items={tocItems} />
            </div>
            <div className="space-y-4">
              <LegalArticle sections={sections} />
              <LegalContactCard settings={settingsQuery.data} />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default PrivacyPage;

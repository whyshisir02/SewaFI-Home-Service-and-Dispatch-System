import { Container } from '../../../components/ui/Layout/Container';
import LegalArticle from '../components/legal/LegalArticle';
import LegalContactCard from '../components/legal/LegalContactCard';
import LegalHero from '../components/legal/LegalHero';
import LegalNotice from '../components/legal/LegalNotice';
import TableOfContents from '../components/legal/TableOfContents';
import { useLegalContent, usePublicSiteSettings } from '../hooks/useLegalContent';

const LAST_UPDATED = 'May 13, 2026';

const draftSections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    paragraphs: ['SewaFi is a home services booking and dispatch platform that connects customers with service providers for local service requests in Nepal.'],
  },
  {
    id: 'user-roles',
    title: '2. User Roles',
    paragraphs: ['SewaFi supports CUSTOMER, PROVIDER, and ADMIN roles. Access and features may differ by role and booking stage.'],
  },
  {
    id: 'customer-responsibilities',
    title: '3. Customer Responsibilities',
    items: [
      'Provide accurate booking details, contact information, and location/address data.',
      'Share service-related information honestly to help providers prepare.',
      'Use the platform in good faith and avoid fraudulent or abusive activity.',
    ],
  },
  {
    id: 'provider-responsibilities',
    title: '4. Provider Responsibilities',
    items: [
      'Maintain accurate profile and service details.',
      'Respond professionally to accepted bookings.',
      'Follow lawful and respectful conduct while using the platform.',
    ],
  },
  {
    id: 'booking-dispatch',
    title: '5. Booking and Dispatch',
    paragraphs: ['When a customer submits a booking, SewaFi may notify eligible providers based on service type, location, and availability. Booking status can change as providers accept or decline. Provider availability is not guaranteed for every request.'],
  },
  {
    id: 'pricing-payments',
    title: '6. Pricing and Payments',
    paragraphs: ['Displayed prices may be estimates. Final pricing is confirmed through the booking and payment confirmation workflow.'],
  },
  {
    id: 'cancellation',
    title: '7. Cancellation',
    paragraphs: ['Cancellation options may depend on booking status and system policy at the time of request. Applicable rules can vary by lifecycle stage.'],
  },
  {
    id: 'account-security',
    title: '8. Account and Security',
    paragraphs: ['Users are responsible for keeping login credentials secure and for activity performed through their accounts unless reported as unauthorized.'],
  },
  {
    id: 'prohibited-use',
    title: '9. Prohibited Use',
    items: [
      'Creating fake bookings or fraudulent service/provider details.',
      'Harassing users or abusing platform communication.',
      'Attempting unauthorized access, automation abuse, or service disruption.',
    ],
  },
  {
    id: 'platform-limitations',
    title: '10. Platform Limitations',
    paragraphs: ['SewaFi provides booking and dispatch infrastructure but does not guarantee that every booking will be accepted or fulfilled.'],
  },
  {
    id: 'changes-terms',
    title: '11. Changes to Terms',
    paragraphs: ['These terms may be updated over time to reflect product, operational, legal, or policy changes.'],
  },
  {
    id: 'contact',
    title: '12. Contact',
    paragraphs: ['If support contact details are provided in system settings, they appear below.'],
  },
];

const parseBackendTerms = (content) => {
  if (!content) return draftSections;
  return [
    {
      id: 'policy',
      title: 'Terms & Conditions',
      paragraphs: String(content)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    },
  ];
};

function TermsPage() {
  const legalQuery = useLegalContent('terms');
  const settingsQuery = usePublicSiteSettings();

  const sections = parseBackendTerms(legalQuery.data?.content);
  const tocItems = sections.map((section) => ({ id: section.id, title: section.title }));
  const lastUpdated = legalQuery.data?.lastUpdated || LAST_UPDATED;
  const showDraftNotice = !legalQuery.data?.content;

  return (
    <div className="bg-[var(--sf-bg)] pb-14 text-[var(--sf-text-main)] sm:pb-16 lg:pb-20">
      <LegalHero
        title={legalQuery.data?.title || 'Terms & Conditions'}
        subtitle="Please read these terms carefully before using SewaFi."
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

export default TermsPage;

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ServiceCard } from './ServiceCard';
import { formatCurrency } from '../../../utils/formatCurrency';

const baseService = {
  id: 42,
  name: 'Deep Home Cleaning',
  description: 'Full-house cleaning by vetted professionals.',
  slug: 'deep-home-cleaning',
  categoryId: 7,
  category: { name: 'Cleaning' },
  basePrice: 2500,
  estimatedDuration: '3 hours',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/cleaning.jpg',
};

const renderCard = (service = baseService) =>
  render(
    <MemoryRouter>
      <ServiceCard service={service} />
    </MemoryRouter>
  );

const priceText = (amount) => `From ${formatCurrency(amount)}`.replace(/\s/g, ' ');

describe('ServiceCard', () => {
  it('renders the service name, description, category and price', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Deep Home Cleaning' })).toBeInTheDocument();
    expect(screen.getByText('Full-house cleaning by vetted professionals.')).toBeInTheDocument();
    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('3 hours')).toBeInTheDocument();
    // formatCurrency emits a non-breaking space that the DOM normalizer collapses.
    expect(screen.getByText(priceText(2500))).toBeInTheDocument();
  });

  it('links to the detail page using the slug when available', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
      'href',
      '/services/deep-home-cleaning'
    );
  });

  it('falls back to the id in the detail path when no slug exists', () => {
    renderCard({ ...baseService, slug: undefined });

    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', '/services/42');
  });

  it('builds the booking link with serviceId and categoryId query params', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute(
      'href',
      '/customer/book/42?serviceId=42&categoryId=7'
    );
  });

  it('omits categoryId from the booking link when the service has no category', () => {
    renderCard({ ...baseService, categoryId: undefined, category: undefined });

    expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute(
      'href',
      '/customer/book/42?serviceId=42'
    );
  });

  it('uses the subcategory name then a generic label for the category chip', () => {
    const { unmount } = renderCard({ ...baseService, category: undefined, subCategory: { name: 'Kitchen' } });
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    unmount();

    renderCard({ ...baseService, category: undefined, subCategory: undefined });
    expect(screen.getByText('Home service')).toBeInTheDocument();
  });

  it('shows fallback copy and hides the meta row when optional fields are missing', () => {
    renderCard({
      id: 9,
      name: 'Handyman Visit',
      slug: 'handyman-visit',
      description: '',
      basePrice: null,
      estimatedDuration: null,
    });

    expect(screen.getByText('Reliable professionals with clear scheduling and pricing.')).toBeInTheDocument();
    expect(screen.queryByText(/^From /)).not.toBeInTheDocument();
  });

  it('renders the service image with a descriptive alt text', () => {
    renderCard();

    expect(screen.getByRole('img', { name: 'Deep Home Cleaning service' })).toBeInTheDocument();
  });

  it('renders the icon fallback instead of an image when no image url is provided', () => {
    renderCard({ ...baseService, imageUrl: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

import { BookingStarter } from '../components/home/BookingStarter';
import { DashboardPreview } from '../components/home/DashboardPreview';
import { DispatchSteps } from '../components/home/DispatchSteps';
import { HeroSection } from '../components/home/HeroSection';
import { HomeFAQ } from '../components/home/HomeFAQ';
import { NepalCoverageSection } from '../components/home/NepalCoverageSection';
import { PopularServices } from '../components/home/PopularServices';
import { ProviderCTA } from '../components/home/ProviderCTA';
import { WhyChooseSewafi } from '../components/home/WhyChooseSewafi';

function Home() {
  return (
    <div className="overflow-hidden bg-[var(--sf-bg)] transition-colors duration-300">
      <HeroSection />
      <BookingStarter />
      <PopularServices />
      <DispatchSteps />
      <WhyChooseSewafi />
      <NepalCoverageSection />
      <DashboardPreview />
      <ProviderCTA />
      <HomeFAQ />
    </div>
  );
}

export default Home;

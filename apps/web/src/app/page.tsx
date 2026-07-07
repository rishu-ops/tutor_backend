import { Navbar } from '@/components/sections/navbar';
import { Hero } from '@/components/sections/hero';
import { CommunityFeed } from '@/components/sections/community-feed';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ForTutors } from '@/components/sections/for-tutors';
import { Footer } from '@/components/sections/footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CommunityFeed />
        <HowItWorks />
        <ForTutors />
      </main>
      <Footer />
    </>
  );
}

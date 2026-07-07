import { Navbar } from '@/components/sections/navbar';
import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ForTutors } from '@/components/sections/for-tutors';
import { Testimonials } from '@/components/sections/testimonials';
import { Footer } from '@/components/sections/footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <ForTutors />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

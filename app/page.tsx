import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Plans } from '@/components/sections/Plans';
import { Leisure } from '@/components/sections/Leisure';
import { Location } from '@/components/sections/Location';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';
import { PlanModal } from '@/components/ui/PlanModal';
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';
import { WhatsappFloat } from '@/components/ui/WhatsappFloat';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Plans />
        <Leisure />
        <Location />
        <Contact />
      </main>
      <Footer />
      <PlanModal />
      <KeyboardShortcuts />
      <WhatsappFloat />
    </>
  );
}

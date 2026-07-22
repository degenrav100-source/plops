import Background from "./components/Background";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Launches from "./components/Launches";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Roadmap from "./components/Roadmap";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar theme={theme} toggleTheme={toggle} />
      <main>
        <Hero />
        <Marquee />
        <Launches />
        <Features />
        <HowItWorks />
        <Roadmap />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

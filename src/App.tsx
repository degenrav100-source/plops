import Background from "./components/Background";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import LaunchedTokens from "./components/LaunchedTokens";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Roadmap from "./components/Roadmap";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import WalletModal from "./components/WalletModal";
import { WalletProvider } from "./wallet/WalletProvider";
import { ToastProvider } from "./toast/ToastProvider";
import { LaunchProvider } from "./launch/LaunchProvider";

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <ToastProvider>
      <WalletProvider>
        <LaunchProvider>
          <div className="relative min-h-screen">
            <Background />
            <Navbar theme={theme} toggleTheme={toggle} />
            <main>
              <Hero />
              <Marquee />
              <LaunchedTokens />
              <Features />
              <HowItWorks />
              <Roadmap />
              <FAQ />
              <CTA />
            </main>
            <Footer />
            <WalletModal />
          </div>
        </LaunchProvider>
      </WalletProvider>
    </ToastProvider>
  );
}

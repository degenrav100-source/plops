import Background from "./components/Background";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import { useHashRoute } from "./hooks/useHashRoute";
import Terminal from "./components/Terminal";
import Docs from "./components/Docs";
import Footer from "./components/Footer";
import WalletModal from "./components/WalletModal";
import WelcomeGate from "./components/WelcomeGate";
import { WalletProvider } from "./wallet/WalletProvider";
import { ToastProvider } from "./toast/ToastProvider";
import { LaunchProvider } from "./launch/LaunchProvider";

export default function App() {
  const { theme, toggle } = useTheme();
  const { route, section } = useHashRoute();
  return (
    <ToastProvider>
      <WalletProvider>
        <LaunchProvider>
          <div id="top" className="relative flex min-h-screen flex-col">
            <Background />
            <Navbar theme={theme} toggleTheme={toggle} />
            <main className="flex-1">
              {route === "docs" ? <Docs section={section} /> : <Terminal />}
            </main>
            <Footer />
            <WalletModal />
            <WelcomeGate />
          </div>
        </LaunchProvider>
      </WalletProvider>
    </ToastProvider>
  );
}

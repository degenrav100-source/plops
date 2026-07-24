import Background from "./components/Background";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import Terminal from "./components/Terminal";
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
          <div id="top" className="relative flex min-h-screen flex-col">
            <Background />
            <Navbar theme={theme} toggleTheme={toggle} />
            <main className="flex-1">
              <Terminal />
            </main>
            <Footer />
            <WalletModal />
          </div>
        </LaunchProvider>
      </WalletProvider>
    </ToastProvider>
  );
}

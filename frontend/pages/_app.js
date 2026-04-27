import '../styles/globals.css';
import '../styles/elderly-mode.css';
import SiteLanguageToggle from '../components/SiteLanguageToggle';
import { LanguageProvider } from '../context/LanguageContext';

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <SiteLanguageToggle />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}

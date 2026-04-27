import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLanguage } from '../context/LanguageContext';

export default function Landing() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const content = language === 'en' ? EN_CONTENT : TA_CONTENT;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');
    if (token && name) {
      setUser({ name, token });
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUser(null);
  }

  useEffect(() => {
    // dynamically load scrollreveal to avoid SSR issues
    const initScrollReveal = async () => {
      try {
        const scrollRevealModule = await import('scrollreveal');
        const ScrollReveal = scrollRevealModule.default;
        
        const sr = ScrollReveal({
          origin: "bottom",
          distance: "50px",
          duration: 1000,
        });

        sr.reveal(".header__image img", { origin: "right" });
        sr.reveal(".header__content p", { delay: 500 });
        sr.reveal(".header__content h1", { delay: 1000 });
        sr.reveal(".header__btns", { delay: 1500 });
        sr.reveal(".destination__card", { interval: 500 });
        sr.reveal(".showcase__image img", { origin: "left" });
        sr.reveal(".showcase__content h4", { delay: 500 });
        sr.reveal(".showcase__content p", { delay: 1000 });
        sr.reveal(".showcase__btn", { delay: 1500 });
        sr.reveal(".banner__card", { interval: 500 });
        sr.reveal(".discover__card", { interval: 500 });
      } catch (err) {
        console.log("ScrollReveal not loaded");
      }
    };

    if (typeof window !== 'undefined') {
      initScrollReveal();
    }
  }, []);

  return (
    <>
      <Head>
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav>
        <div className="nav__header">
          <div className="nav__logo">
            <a href="#" className="logo">{content.brand}</a>
          </div>
          <div 
            className="nav__menu__btn" 
            id="menu-btn"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            <i className={isNavOpen ? "ri-close-line" : "ri-menu-line"}></i>
          </div>
        </div>
        <ul className={`nav__links ${isNavOpen ? 'open' : ''}`} id="nav-links" onClick={() => setIsNavOpen(false)}>
          <li><a href="#home">{content.nav.home}</a></li>
          <li><a href="#about">{content.nav.about}</a></li>
          <li><a href="#tour">{content.nav.tour}</a></li>
          <li><a href="#package">{content.nav.package}</a></li>
          <li><a href="#contact">{content.nav.contact}</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/planner'); }}>{content.nav.planner}</a></li>
        </ul>
        <div className="nav__btns" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.95rem' }}>
                {content.nav.greeting}, {user.name}
              </span>
              <button className="btn" onClick={() => router.push('/planner')}>{content.nav.planner}</button>
              <button className="btn" onClick={handleLogout} style={{ background: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>{content.nav.logout}</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => router.push('/login')} style={{ background: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>{content.nav.login}</button>
              <button className="btn" onClick={() => router.push('/register')}>{content.nav.register}</button>
            </>
          )}
        </div>
      </nav>

      <header id="home">
        <div className="header__container">
          <div className="header__content">
            <p>{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <div className="header__btns">
              <button className="btn" onClick={() => router.push('/register')}>{content.hero.primaryCta}</button>
              <a href="#">
                <span><i className="ri-play-circle-fill"></i></span>
              </a>
            </div>
          </div>
          <div className="header__image">
            <img src="/img/bus.png" alt="header" />
          </div>
        </div>
      </header>

      <section className="section__container destination__container" id="about">
        <h2 className="section__header">{content.destinations.title}</h2>
        <p className="section__description">{content.destinations.description}</p>
        <div className="destination__grid">
          {content.destinations.cards.map((card) => (
          <div className="destination__card" key={card.title}>
            <img
              src={card.image}
              alt={card.title}
            />
            <div className="destination__card__details">
              <div>
                <h4>{card.title}</h4>
                <p>{card.description}</p>
              </div>
              <div className="destination__ratings">
                <span><i className="ri-star-fill"></i></span>
                {card.rating}
              </div>
            </div>
          </div>
          ))}
        </div>
      </section>

      <section className="section__container journey__container" id="tour">
        <h2 className="section__header">{content.journey.title}</h2>
        <p className="section__description">{content.journey.description}</p>
        <div className="journey__grid">
          {content.journey.cards.map((card) => (
          <div className="journey__card" key={card.title}>
            <div className="journey__card__bg">
              <span><i className={card.icon}></i></span>
              <h4>{card.title}</h4>
            </div>
            <div className="journey__card__content">
              <span><i className={card.icon}></i></span>
              <h4>{card.contentTitle}</h4>
              <p>{card.content}</p>
            </div>
          </div>
          ))}
        </div>
      </section>

      <section className="section__container showcase__container" id="package">
        <div className="showcase__image">
          <img src="/img/showcase.webp" alt="showcase" />
        </div>
        <div className="showcase__content">
          <h4>{content.showcase.title}</h4>
          <p>{content.showcase.body1}</p>
          <p>{content.showcase.body2}</p>
          <div className="showcase__btn">
            <button className="btn" onClick={() => router.push('/register')}>
              {content.showcase.cta}
              <span><i className="ri-arrow-right-line"></i></span>
            </button>
          </div>
        </div>
      </section>

      <section className="section__container banner__container">
        <div className="banner__card">
          <h4>10+</h4>
          <p>{content.banner.experience}</p>
        </div>
        <div className="banner__card">
          <h4>12k</h4>
          <p>{content.banner.customers}</p>
        </div>
        <div className="banner__card">
          <h4>4.8</h4>
          <p>{content.banner.ratings}</p>
        </div>
      </section>

      <section className="section__container discover__container">
        <h2 className="section__header">{content.discover.title}</h2>
        <p className="section__description">{content.discover.description}</p>
        <div className="discover__grid">
          {content.discover.cards.map((card) => (
          <div className="discover__card" key={card.title}>
            <span><i className={card.icon}></i></span>
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
          ))}
        </div>
      </section>

      <footer id="contact">
        <div className="section__container footer__container">
          <div className="footer__col">
            <div className="footer__logo">
              <a href="#" className="logo">{content.brand}</a>
            </div>
            <p>{content.footer.about}</p>
            <ul className="footer__socials">
              <li><a href="#!"><i className="ri-facebook-fill"></i></a></li>
              <li><a href="#!"><i className="ri-instagram-line"></i></a></li>
              <li><a href="#!"><i className="ri-youtube-line"></i></a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{content.footer.quickLinksTitle}</h4>
            <ul className="footer__links">
              <li><a href="#home">{content.nav.home}</a></li>
              <li><a href="#tour">{content.nav.tour}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/planner'); }}>{content.nav.planner}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/login'); }}>{content.nav.login}</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{content.footer.contactTitle}</h4>
            <ul className="footer__links">
              <li>
                <a href="#"><span><i className="ri-phone-fill"></i></span>+91 12345 67890</a>
              </li>
              <li>
                <a href="#"><span><i className="ri-record-mail-line"></i></span> {content.footer.email}</a>
              </li>
              <li>
                <a href="#"><span><i className="ri-map-pin-2-fill"></i></span> {content.footer.location}</a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{content.footer.subscribeTitle}</h4>
            <form action="#!">
              <input type="text" placeholder={content.footer.subscribePlaceholder} />
              <button className="btn">{content.footer.subscribeButton}</button>
            </form>
          </div>
        </div>
        <div className="footer__bar">
          {content.footer.copyright}
          <p>
            {content.footer.deliveredBy} <a className="text-white" href="https://www.themewagon.com" target="_blank">ThemeWagon</a>
          </p>
        </div>
      </footer>
      <style jsx global>{`
        body { font-family: 'Noto Sans Tamil', 'Inter', sans-serif; }
      `}</style>
    </>
  );
}

const TA_CONTENT = {
  metaTitle: 'பேருந்து பயணி - உங்கள் பயண வழிகாட்டி',
  metaDescription: 'உங்கள் பயணத்தை பேருந்தில் தொடங்குங்கள்',
  brand: 'பேருந்து பயணி',
  nav: {
    home: 'முகப்பு',
    about: 'பற்றி',
    tour: 'சுற்றுலா',
    package: 'தொகுப்பு',
    contact: 'தொடர்பு',
    planner: 'திட்டமிடுபவர்',
    greeting: 'வணக்கம்',
    logout: 'வெளியேறு',
    login: 'உள்நுழைக',
    register: 'பயணத்தை பதிவு செய்',
  },
  hero: {
    eyebrow: 'உங்கள் பயணத்தை பேருந்தில் தொடங்குங்கள்',
    title: 'ஒவ்வொரு பேருந்து பயணமும் மாயாஜாலமாக உணரும் இடம்!',
    primaryCta: 'இப்போதே பயணத்தை பதிவு செய்யுங்கள்',
  },
  destinations: {
    title: 'பிரபலமான இடங்கள்',
    description: 'உலகெங்கிலும் மிகவும் விரும்பப்படும் இடங்களைக் கண்டறியுங்கள்',
    cards: [
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/MADURAI%20MEENAKSHI%20AMMAN%20TEMPLE%20TOWER.JPG',
        title: 'மதுரை மீனாட்சி அம்மன் கோவில்',
        description: 'மதுரையில் உள்ள இந்த பிரசித்தி பெற்ற கோவில், திராவிடக் கட்டிடக்கலையின் சிறந்த எடுத்துக்காட்டாகும். அழகிய கோபுரங்கள் மற்றும் சிற்பங்கள் சுற்றுலா பயணிகளை கவர்கின்றன.',
        rating: '4.8',
      },
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ooty%20Tea%20Gardens.jpg',
        title: 'ஊட்டி மலைநகர்',
        description: 'நீலகிரி மலைகளில் அமைந்துள்ள ஊட்டி, குளிரான காலநிலை, தேயிலைத் தோட்டங்கள் மற்றும் அழகிய இயற்கைக் காட்சிகளால் பிரசித்தம். குடும்பத்துடன் செல்ல சிறந்த இடம்.',
        rating: '4.7',
      },
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/View-of-Kanyakumari-from-Vivekananda-Rock-Memorial.jpg',
        title: 'கன்னியாகுமரி கடற்கரை',
        description: 'இந்தியாவின் தெற்குத் திசை முடிவில் அமைந்துள்ள கன்னியாகுமரி, சூரிய உதயம் மற்றும் அஸ்தமனம் காண சிறந்த இடமாகும். கடல் மற்றும் கலாச்சாரம் ஒன்றிணையும் அழகான தலம்.',
        rating: '4.6',
      },
    ],
  },
  journey: {
    title: 'பேருந்து பயணம், எளிதான வழி!',
    description: 'உங்கள் அடுத்த சாகசத்திற்கான சிரமமற்ற திட்டமிடல்',
    cards: [
      {
        icon: 'ri-bookmark-3-line',
        title: 'தடையற்ற பதிவுசெய்தல் செயல்முறை',
        contentTitle: 'இருக்கை பதிவு, ஒரு கிளிக்கில்',
        content: 'டிக்கெட் பதிவு செய்வது முதல் உங்கள் பேருந்தை நிகழ்நேரத்தில் கண்காணிப்பது வரை அனைத்தும் ஒரு கிளிக்கில். நீண்ட வரிசைகளோ அல்லது கடைசி நிமிட குழப்பங்களோ இனி இல்லை - முழு எளிமையுடன் திட்டமிடுங்கள், பதிவு செய்யுங்கள் மற்றும் ஏறுங்கள்.',
      },
      {
        icon: 'ri-landscape-fill',
        title: 'வடிவமைக்கப்பட்ட பயணத்திட்டங்கள்',
        contentTitle: 'உங்களுக்காகவே தனிப்பயனாக்கப்பட்ட திட்டங்கள்',
        content: 'அனைவரும் வித்தியாசமாகப் பயணிக்கிறார்கள் - அதனால்தான் நாங்கள் உங்களுக்காக மட்டுமே திட்டங்களை உருவாக்குகிறோம். நேரம், பட்ஜெட், இருக்கை விருப்பம் என அனைத்தும் உங்கள் தேவைக்கேற்ப பொருந்தும்.',
      },
      {
        icon: 'ri-map-2-line',
        title: 'நிபுணர் உள்ளூர் நுண்ணறிவுகள்',
        contentTitle: 'உள் உதவிக்குறிப்புகள் மற்றும் பரிந்துரைகள்',
        content: 'சிறந்த ஏறும் இடங்கள் முதல் உள்ளூர் பயண தந்திரங்கள் வரை, எங்கள் நுண்ணறிவுகள் சாலைகளை நன்கு அறிந்தவர்களிடமிருந்து வருகிறது. உங்கள் அடுத்த பயணத்திற்கான நம்பகமான உதவி இதுதான்.',
      },
    ],
  },
  showcase: {
    title: 'ஒவ்வொரு பேருந்து பயணத்தின் மூலமும் உங்கள் பயண ஆசையைத் தூண்டுங்கள்',
    body1: 'பேருந்தில் பயணிப்பது அற்புதமான இடங்களை நோக்கிய உங்கள் வழியில் வசதியையும் அற்புதமான காட்சிகளையும் வழங்குகிறது. விசாலமான இருக்கைகள் மற்றும் ஏர் கண்டிஷனிங் மூலம், நீங்கள் ஒரு துடிப்பான நகரத்திற்கோ அல்லது அமைதியான விடுமுறைக்கோ சென்றாலும் ஓய்வெடுத்து சவாரி செய்யலாம்.',
    body2: 'பேருந்து மூலம் உலகை எளிதாக ஆராயுங்கள். ஒரு பேருந்தில் ஏறி உங்கள் சொந்த வேகத்தில் பயணத்தின் மகிழ்ச்சியை அனுபவிக்கவும். வசதியான இருக்கைகள் முதல் இயற்கை எழில் கொஞ்சும் பாதைகள் வரை, நகரங்கள், இயற்கை மற்றும் இடையில் உள்ள அனைத்தையும் ஆராய்வதற்கான சரியான வழியை எங்கள் பேருந்துகள் வழங்குகின்றன.',
    cta: 'இப்போதே ஒரு பேருந்தை பதிவு செய்யுங்கள்',
  },
  banner: {
    experience: 'ஆண்டுகள் அனுபவம்',
    customers: 'மகிழ்ச்சியான வாடிக்கையாளர்கள்',
    ratings: 'ஒட்டுமொத்த மதிப்பீடுகள்',
  },
  discover: {
    title: 'எங்கள் கோவில் பேருந்து பயணங்கள் மூலம் அமைதி, கலாச்சாரம் மற்றும் பக்தியைக் கண்டறியுங்கள்',
    description: 'உங்கள் பேருந்து இருக்கையின் வசதியிலிருந்து அதிர்ச்சியூட்டும் நிலப்பரப்புகளைக் காணுங்கள்',
    cards: [
      {
        icon: 'ri-camera-lens-line',
        title: 'உங்கள் சாலை, உங்கள் கதை',
        description: 'எங்கள் வசதியான மற்றும் நம்பகமான பேருந்து பயணங்களுடன் பயணத்தின் சுதந்திரத்தை அனுபவிக்கவும். குறுகிய பயணம் முதல் நீண்ட சவாரி வரை, எங்கள் பேருந்துகள் சுமூகமான அனுபவத்தை உறுதி செய்கின்றன.',
      },
      {
        icon: 'ri-ship-line',
        title: 'கடலோர அதிசயங்கள்',
        description: 'தூய்மையான கடற்கரைகள், பிரமிக்க வைக்கும் பாறைகள் மற்றும் மூச்சடைக்கக் கூடிய கடல் காட்சிகள் வழியாக மயக்கும் பயணத்தை அனுபவிக்கவும். கடலோர காற்றே உங்கள் வழிகாட்டி ஆகட்டும்.',
      },
      {
        icon: 'ri-landscape-line',
        title: 'வரலாற்றுச் சின்னங்கள்',
        description: 'எங்கள் சிறப்பாகத் தொகுக்கப்பட்ட பேருந்து சுற்றுப்பயணங்களில் வரலாற்றுச் சின்னங்களின் அழகை ஆராயுங்கள். சின்ன இடங்களையும் அவற்றின் கதைகளையும் அமைதியாக அனுபவிக்க எங்கள் பேருந்துகள் உங்களை அழைத்துச் செல்லும்.',
      },
    ],
  },
  footer: {
    about: 'எங்கள் அனைத்து-இன்-ஒன் பேருந்து பயண தளத்தின் மூலம் உலகை எளிதாகவும் உற்சாகத்துடனும் ஆராயுங்கள். உங்கள் பயணம் இங்கே தொடங்குகிறது - சுமுகமான திட்டமிடல் மறக்க முடியாத சாலை அனுபவங்களைச் சந்திக்கும் இடம்.',
    quickLinksTitle: 'விரைவான இணைப்புகள்',
    contactTitle: 'எங்களை தொடர்பு கொள்ள',
    subscribeTitle: 'சந்தா சேர',
    subscribePlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    subscribeButton: 'சந்தா சேர',
    email: 'தகவல்@பேருந்துபயணி',
    location: 'ஆக்ரா, இந்தியா',
    copyright: 'பதிப்புரிமை © 2026 தமிழ் AI பயண திட்டமிடுபவர். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    deliveredBy: 'விநியோகித்தவர்',
  },
};

const EN_CONTENT = {
  metaTitle: 'Bus Traveler - Your Travel Guide',
  metaDescription: 'Start your journey by bus.',
  brand: 'Bus Traveler',
  nav: {
    home: 'Home',
    about: 'About',
    tour: 'Tours',
    package: 'Packages',
    contact: 'Contact',
    planner: 'Planner',
    greeting: 'Hi',
    logout: 'Logout',
    login: 'Login',
    register: 'Register Trip',
  },
  hero: {
    eyebrow: 'Start your journey by bus',
    title: 'A place where every bus ride feels magical.',
    primaryCta: 'Book your trip now',
  },
  destinations: {
    title: 'Popular Destinations',
    description: 'Discover the places travelers love the most.',
    cards: [
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/MADURAI%20MEENAKSHI%20AMMAN%20TEMPLE%20TOWER.JPG',
        title: 'Madurai Meenakshi Amman Temple',
        description: 'This famous temple in Madurai is a classic example of Dravidian architecture. Its towers and carvings continue to draw visitors from everywhere.',
        rating: '4.8',
      },
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ooty%20Tea%20Gardens.jpg',
        title: 'Ooty Hill Town',
        description: 'Ooty is known for cool weather, tea gardens, and scenic views. It is a wonderful pick for a calm family getaway.',
        rating: '4.7',
      },
      {
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/View-of-Kanyakumari-from-Vivekananda-Rock-Memorial.jpg',
        title: 'Kanyakumari Coast',
        description: 'At the southern tip of India, Kanyakumari is loved for sunrise, sunset, sea views, and a rich cultural atmosphere.',
        rating: '4.6',
      },
    ],
  },
  journey: {
    title: 'Bus travel made simple',
    description: 'Effortless planning for your next adventure.',
    cards: [
      {
        icon: 'ri-bookmark-3-line',
        title: 'Smooth booking flow',
        contentTitle: 'Reserve your seat in one click',
        content: 'From ticket booking to tracking your bus in real time, everything is streamlined. No long lines and no last-minute confusion - just plan, book, and board with ease.',
      },
      {
        icon: 'ri-landscape-fill',
        title: 'Tailored itineraries',
        contentTitle: 'Plans shaped around you',
        content: 'Everyone travels differently, so we shape trips around your timing, budget, and seat preferences. The result is a plan that feels personal instead of generic.',
      },
      {
        icon: 'ri-map-2-line',
        title: 'Local travel insight',
        contentTitle: 'Tips that actually help',
        content: 'From the best boarding points to practical local advice, our suggestions come from people who know these roads well. It is the kind of detail that makes a trip smoother.',
      },
    ],
  },
  showcase: {
    title: 'Spark your travel appetite with every bus trip',
    body1: 'Traveling by bus gives you comfort and sweeping views on the way to remarkable destinations. Spacious seats and air conditioning make the ride easy whether you are headed to a lively city or a quiet escape.',
    body2: 'Explore more with less friction. From comfortable seats to scenic roads, our buses make it easy to enjoy cities, nature, and everything in between at your own pace.',
    cta: 'Book a bus now',
  },
  banner: {
    experience: 'Years of experience',
    customers: 'Happy customers',
    ratings: 'Overall ratings',
  },
  discover: {
    title: 'Discover peace, culture, and devotion through our temple bus journeys',
    description: 'Take in stunning landscapes from the comfort of your seat.',
    cards: [
      {
        icon: 'ri-camera-lens-line',
        title: 'Your road, your story',
        description: 'Enjoy the freedom of the road with comfortable and reliable bus journeys. Short ride or long trip, we keep the experience smooth and enjoyable.',
      },
      {
        icon: 'ri-ship-line',
        title: 'Coastal wonders',
        description: 'Travel through clean beaches, dramatic cliffs, and unforgettable sea views. Let the coastal breeze lead you toward memorable places.',
      },
      {
        icon: 'ri-landscape-line',
        title: 'Historic landmarks',
        description: 'Explore iconic landmarks on curated bus tours that make the stories of each destination easier to experience and remember.',
      },
    ],
  },
  footer: {
    about: 'Explore the world with ease and excitement through our all-in-one bus travel platform. Your trip starts here, where smooth planning meets unforgettable road experiences.',
    quickLinksTitle: 'Quick Links',
    contactTitle: 'Contact Us',
    subscribeTitle: 'Subscribe',
    subscribePlaceholder: 'Enter your email',
    subscribeButton: 'Subscribe',
    email: 'info@bustraveler',
    location: 'Agra, India',
    copyright: 'Copyright © 2026 Tamil AI Travel Planner. All rights reserved.',
    deliveredBy: 'Delivered by',
  },
};

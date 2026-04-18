import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Landing() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState(null);

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
        <title>பேருந்து பயணி - உங்கள் பயண வழிகாட்டி</title>
        <meta name="description" content="உங்கள் பயணத்தை பேருந்தில் தொடங்குங்கள்" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav>
        <div className="nav__header">
          <div className="nav__logo">
            <a href="#" className="logo">பேருந்து பயணி</a>
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
          <li><a href="#home">முகப்பு</a></li>
          <li><a href="#about">பற்றி</a></li>
          <li><a href="#tour">சுற்றுலா</a></li>
          <li><a href="#package">தொகுப்பு</a></li>
          <li><a href="#contact">தொடர்பு</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/planner'); }}>திட்டமிடுபவர்</a></li>
        </ul>
        <div className="nav__btns" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.95rem' }}>
                வணக்கம், {user.name}
              </span>
              <button className="btn" onClick={() => router.push('/planner')}>திட்டமிடுபவர்</button>
              <button className="btn" onClick={handleLogout} style={{ background: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>வெளியேறு</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => router.push('/login')} style={{ background: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>உள்நுழைக</button>
              <button className="btn" onClick={() => router.push('/register')}>பயணத்தை பதிவு செய்</button>
            </>
          )}
        </div>
      </nav>

      <header id="home">
        <div className="header__container">
          <div className="header__content">
            <p>உங்கள் பயணத்தை பேருந்தில் தொடங்குங்கள்</p>
            <h1>ஒவ்வொரு பேருந்து பயணமும் மாயாஜாலமாக உணரும் இடம்!</h1>
            <div className="header__btns">
              <button className="btn" onClick={() => router.push('/register')}>இப்போதே பயணத்தை பதிவு செய்யுங்கள்</button>
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
        <h2 className="section__header">பிரபலமான இடங்கள்</h2>
        <p className="section__description">
          உலகெங்கிலும் மிகவும் விரும்பப்படும் இடங்களைக் கண்டறியுங்கள்
        </p>
        <div className="destination__grid">
          <div className="destination__card">
            <img
              src="https://commons.wikimedia.org/wiki/Special:FilePath/MADURAI%20MEENAKSHI%20AMMAN%20TEMPLE%20TOWER.JPG"
              alt="மதுரை மீனாட்சி அம்மன் கோவில்"
            />
            <div className="destination__card__details">
              <div>
                <h4>மதுரை மீனாட்சி அம்மன் கோவில்</h4>
                <p>மதுரையில் உள்ள இந்த பிரசித்தி பெற்ற கோவில், திராவிடக் கட்டிடக்கலையின் சிறந்த எடுத்துக்காட்டாகும். அழகிய கோபுரங்கள் மற்றும் சிற்பங்கள் சுற்றுலா பயணிகளை கவர்கின்றன.</p>
              </div>
              <div className="destination__ratings">
                <span><i className="ri-star-fill"></i></span>
                4.8
              </div>
            </div>
          </div>
          <div className="destination__card">
            <img
              src="https://commons.wikimedia.org/wiki/Special:FilePath/Ooty%20Tea%20Gardens.jpg"
              alt="ஊட்டி மலைநகர்"
            />
            <div className="destination__card__details">
              <div>
                <h4>ஊட்டி மலைநகர்</h4>
                <p>நீலகிரி மலைகளில் அமைந்துள்ள ஊட்டி, குளிரான காலநிலை, தேயிலைத் தோட்டங்கள் மற்றும் அழகிய இயற்கைக் காட்சிகளால் பிரசித்தம். குடும்பத்துடன் செல்ல சிறந்த இடம்.</p>
              </div>
              <div className="destination__ratings">
                <span><i className="ri-star-fill"></i></span>
                4.7
              </div>
            </div>
          </div>
          <div className="destination__card">
            <img
              src="https://commons.wikimedia.org/wiki/Special:FilePath/View-of-Kanyakumari-from-Vivekananda-Rock-Memorial.jpg"
              alt="கன்னியாகுமரி கடற்கரை"
            />
            <div className="destination__card__details">
              <div>
                <h4>கன்னியாகுமரி கடற்கரை</h4>
                <p>இந்தியாவின் தெற்குத் திசை முடிவில் அமைந்துள்ள கன்னியாகுமரி, சூரிய உதயம் மற்றும் அஸ்தமனம் காண சிறந்த இடமாகும். கடல் மற்றும் கலாச்சாரம் ஒன்றிணையும் அழகான தலம்.</p>
              </div>
              <div className="destination__ratings">
                <span><i className="ri-star-fill"></i></span>
                4.6
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section__container journey__container" id="tour">
        <h2 className="section__header">பேருந்து பயணம், எளிதான வழி!</h2>
        <p className="section__description">
          உங்கள் அடுத்த சாகசத்திற்கான சிரமமற்ற திட்டமிடல்
        </p>
        <div className="journey__grid">
          <div className="journey__card">
            <div className="journey__card__bg">
              <span><i className="ri-bookmark-3-line"></i></span>
              <h4>தடையற்ற பதிவுசெய்தல் செயல்முறை</h4>
            </div>
            <div className="journey__card__content">
              <span><i className="ri-bookmark-3-line"></i></span>
              <h4>இருக்கை பதிவு, ஒரு கிளிக்கில்</h4>
              <p>
                டிக்கெட் பதிவு செய்வது முதல் உங்கள் பேருந்தை நிகழ்நேரத்தில் கண்காணிப்பது வரை அனைத்தும் 
                ஒரு கிளிக்கில். நீண்ட வரிசைகளோ அல்லது கடைசி நிமிட குழப்பங்களோ இனி இல்லை 
                — முழு எளிமையுடன் திட்டமிடுங்கள், பதிவு செய்யுங்கள் மற்றும் ஏறுங்கள். உங்கள் பயணம் எளிமைப்படுத்தப்பட்டுள்ளது.
              </p>
            </div>
          </div>

          <div className="journey__card">
            <div className="journey__card__bg">
              <span><i className="ri-landscape-fill"></i></span>
              <h4>வடிவமைக்கப்பட்ட பயணத்திட்டங்கள்</h4>
            </div>
            <div className="journey__card__content">
              <span><i className="ri-landscape-fill"></i></span>
              <h4>உங்களுக்காகவே தனிப்பயனாக்கப்பட்ட திட்டங்கள்</h4>
              <p>
                அனைவரும் வித்தியாசமாகப் பயணிக்கிறார்கள் — அதனால்தான் நாங்கள் உங்களுக்காக மட்டுமே திட்டங்களை உருவாக்குகிறோம்.
                விருப்பமான நேரங்கள் முதல் பட்ஜெட்டுக்கு ஏற்ற விருப்பங்கள் மற்றும் இருக்கைத் தேர்வுகள் வரை,
                உங்கள் வாழ்க்கை முறைக்கேற்ப வடிவமைக்கப்பட்ட பயணத்தை அனுபவிக்கவும்.
              </p>
            </div>
          </div>

          <div className="journey__card">
            <div className="journey__card__bg">
              <span><i className="ri-map-2-line"></i></span>
              <h4>நிபுணர் உள்ளூர் நுண்ணறிவுகள்</h4>
            </div>
            <div className="journey__card__content">
              <span><i className="ri-map-2-line"></i></span>
              <h4>உள் உதவிக்குறிப்புகள் மற்றும் பரிந்துரைகள்</h4>
              <p>
                சிறந்த ஏறும் இடங்கள் முதல் உள்ளூர் பயண தந்திரங்கள் வரை, எங்கள் நுண்ணறிவுகள்
                சாலைகளை அறிந்த உண்மையான நபர்களால் இயக்கப்படுகின்றன. இது உள்ளூர்
                அறிவு, நேரடியாக உங்கள் திரையில் வழங்கப்படுகிறது.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section__container showcase__container" id="package">
        <div className="showcase__image">
          <img src="/img/showcase.webp" alt="showcase" />
        </div>
        <div className="showcase__content">
          <h4>ஒவ்வொரு பேருந்து பயணத்தின் மூலமும் உங்கள் பயண ஆசையைத் தூண்டுங்கள்</h4>
          <p>
            பேருந்தில் பயணிப்பது அற்புதமான இடங்களை நோக்கிய உங்கள் வழியில் வசதியையும் அற்புதமான காட்சிகளையும் வழங்குகிறது.
            விசாலமான இருக்கைகள் மற்றும் ஏர் கண்டிஷனிங் மூலம், நீங்கள் ஒரு துடிப்பான நகரத்திற்கோ
            அல்லது அமைதியான விடுமுறைக்கோ சென்றாலும் ஓய்வெடுத்து சவாரி செய்யலாம். இது பயணத்தின் 
            அழகை அனுபவிக்கும் அதே வேளையில் மலிவு விலையிலும் வசதியாகவும் பயணிக்க சரியான வழி.
          </p>
          <p>
            பேருந்து மூலம் உலகை எளிதாக ஆராயுங்கள். ஒரு பேருந்தில் ஏறி உங்கள் சொந்த வேகத்தில் பயணத்தின் மகிழ்ச்சியை அனுபவிக்கவும்.
            வசதியான இருக்கைகள் முதல் இயற்கை எழில் கொஞ்சும் பாதைகள் வரை, நகரங்கள், இயற்கை மற்றும் 
            இடையில் உள்ள அனைத்தையும் ஆராய்வதற்கான சரியான வழியை எங்கள் பேருந்துகள் வழங்குகின்றன.
            இது ஒரு குறுகிய பயணமாக இருந்தாலும் சரி அல்லது நீண்ட சாகசமாக இருந்தாலும் சரி, வசதியாக அமர்ந்து, ஓய்வெடுத்து சவாரியை அனுபவிக்கவும்.
          </p>
          <div className="showcase__btn">
            <button className="btn" onClick={() => router.push('/register')}>
              இப்போதே ஒரு பேருந்தை பதிவு செய்யுங்கள்
              <span><i className="ri-arrow-right-line"></i></span>
            </button>
          </div>
        </div>
      </section>

      <section className="section__container banner__container">
        <div className="banner__card">
          <h4>10+</h4>
          <p>ஆண்டுகள் அனுபவம்</p>
        </div>
        <div className="banner__card">
          <h4>12k</h4>
          <p>மகிழ்ச்சியான வாடிக்கையாளர்கள்</p>
        </div>
        <div className="banner__card">
          <h4>4.8</h4>
          <p>ஒட்டுமொத்த மதிப்பீடுகள்</p>
        </div>
      </section>

      <section className="section__container discover__container">
        <h2 className="section__header">
          எங்கள் கோவில் பேருந்து பயணங்கள் மூலம் அமைதி, கலாச்சாரம் மற்றும் பக்தியைக் கண்டறியுங்கள்
        </h2>
        <p className="section__description">
          உங்கள் பேருந்து இருக்கையின் வசதியிலிருந்து அதிர்ச்சியூட்டும் நிலப்பரப்புகளைக் காணுங்கள்
        </p>
        <div className="discover__grid">
          <div className="discover__card">
            <span><i className="ri-camera-lens-line"></i></span>
            <h4>உங்கள் சாலை, உங்கள் கதை</h4>
            <p>
              எங்கள் வசதியான மற்றும் நம்பகமான பேருந்து பயணங்களுடன் பயணத்தின் சுதந்திரத்தை அனுபவிக்கவும்.
              விசாலமான இருக்கைகளில் ஓய்வெடுக்கும் போது வழியில் உள்ள பிரமிக்க வைக்கும் காட்சிகளை அனுபவிக்கவும்.
              இது ஒரு குறுகிய பயணமோ அல்லது நீண்ட பயணமோ எதுவாக இருந்தாலும், எங்கள் 
              பேருந்துகள் சுமூகமான மற்றும் சுவாரஸ்யமான பயணத்தை உறுதி செய்கின்றன.
            </p>
          </div>
          <div className="discover__card">
            <span><i className="ri-ship-line"></i></span>
            <h4>கடலோர அதிசயங்கள்</h4>
            <p>
              மயக்கும் கடலோர அதிசயங்கள் வழியாக ஒரு பயணத்தைத் தொடங்குங்கள். தூய்மையான கடற்கரைகள்,
              பிரமிக்க வைக்கும் பாறைகள் மற்றும் மூச்சடைக்கக் கூடிய கடல் காட்சிகளின் அமைதியான அழகை
              எங்கள் பேருந்தின் வசதியிலிருந்து அனுபவிக்கவும். கடலோர காற்று
              மறக்க முடியாத இடங்களுக்கு உங்களை வழிநடத்தட்டும்.
            </p>
          </div>
          <div className="discover__card">
            <span><i className="ri-landscape-line"></i></span>
            <h4>வரலாற்றுச் சின்னங்கள்</h4>
            <p>
              எங்கள் சிறப்பாகத் தொகுக்கப்பட்ட பேருந்து சுற்றுப்பயணங்களில் வரலாற்றுச் சின்னங்களின் அழகை ஆராயுங்கள்.
              எங்களின் வசதியான பேருந்துகள் உங்களை சின்னச் சின்ன இடங்களுக்கு அழைத்துச் செல்லும்,
              அவர்களின் கண்கவர் கதைகளைப் பற்றிய நுண்ணறிவுகளை வழங்கும். நிதானமாக அமர்ந்து,
              ஒவ்வொரு இடமும் வைத்திருக்கும் பணக்கார வரலாற்றில் மூழ்கிவிடுங்கள்.
            </p>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="section__container footer__container">
          <div className="footer__col">
            <div className="footer__logo">
              <a href="#" className="logo">பேருந்து பயணி</a>
            </div>
            <p>
              எங்கள் அனைத்து-இன்-ஒன் பேருந்து பயண தளத்தின் மூலம் உலகை எளிதாகவும் உற்சாகத்துடனும் ஆராயுங்கள்.
              உங்கள் பயணம் இங்கே தொடங்குகிறது — சுமுகமான திட்டமிடல் மறக்க முடியாத சாலை அனுபவங்களைச் சந்திக்கும் இடம்.
            </p>
            <ul className="footer__socials">
              <li><a href="#!"><i className="ri-facebook-fill"></i></a></li>
              <li><a href="#!"><i className="ri-instagram-line"></i></a></li>
              <li><a href="#!"><i className="ri-youtube-line"></i></a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>விரைவான இணைப்புகள்</h4>
            <ul className="footer__links">
              <li><a href="#home">முகப்பு</a></li>
              <li><a href="#tour">சுற்றுலா</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/planner'); }}>திட்டமிடுபவர்</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/login'); }}>உள்நுழைவு</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>எங்களை தொடர்பு கொள்ள</h4>
            <ul className="footer__links">
              <li>
                <a href="#"><span><i className="ri-phone-fill"></i></span>+91 12345 67890</a>
              </li>
              <li>
                <a href="#"><span><i className="ri-record-mail-line"></i></span> தகவல்@பேருந்துபயணி</a>
              </li>
              <li>
                <a href="#"><span><i className="ri-map-pin-2-fill"></i></span> ஆக்ரா, இந்தியா</a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>சந்தா சேர</h4>
            <form action="#!">
              <input type="text" placeholder="உங்கள் மின்னஞ்சலை உள்ளிடவும்" />
              <button className="btn">சந்தா சேர</button>
            </form>
          </div>
        </div>
        <div className="footer__bar">
          பதிப்புரிமை © 2026 தமிழ் AI பயண திட்டமிடுபவர். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.
          <p>
            விநியோகித்தவர் <a className="text-white" href="https://www.themewagon.com" target="_blank">தீம்வாகன்</a>
          </p>
        </div>
      </footer>
      <style jsx global>{`
        body { font-family: 'Noto Sans Tamil', 'Inter', sans-serif; }
      `}</style>
    </>
  );
}

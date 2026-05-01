import { useState, useEffect, useRef, CSSProperties } from "react";
import Checkout from "../components/Checkout";

// ── Types ──────────────────────────────────────────────────────────────────
interface Variety { name: string; days: string; benefit: string; }
interface Step { num: string; title: string; text: string; }
interface FoodItem { src: string; label: string; }
interface Benefit { num: string; title: string; text: string; }

// ── Hook ───────────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── Data ───────────────────────────────────────────────────────────────────
const varieties: Variety[] = [
  { name: "Базилік",   days: "7–10 днів",  benefit: "Покращує здоров'я серця, антисептичні властивості" },
  { name: "Броколі",   days: "7–14 днів",  benefit: "Антиоксиданти та вітамін C" },
  { name: "Люцерна",   days: "7–10 днів",  benefit: "Підтримує імунну систему, покращує травлення" },
  { name: "Редис",     days: "5–7 днів",   benefit: "Нормалізує обмін речовин" },
  { name: "Соняшник",  days: "7–10 днів",  benefit: "Корисні жири і білок" },
  { name: "Капуста",   days: "7–14 днів",  benefit: "Зміцнює імунітет, підтримує травлення" },
  { name: "Салат",     days: "7–10 днів",  benefit: "Вітаміни та клітковина" },
  { name: "Горох",     days: "7–14 днів",  benefit: "Покращує стан шкіри і волосся" },
  { name: "Гірчиця",   days: "7–10 днів",  benefit: "Підтримує здоров'я травної системи" },
  { name: "Рукола",    days: "7–10 днів",  benefit: "Антиоксиданти, підтримує здоров'я серця" },
];

const steps: Step[] = [
  { num: "01", title: "Засипте насіння",   text: "Рівномірно розподіліть насіння по льняному килимку в контейнері." },
  { num: "02", title: "Зволожте",           text: "Легко полийте, щоб килимок був вологим. Не перезволожуйте." },
  { num: "03", title: "Накрийте та пророщуйте", text: "Складіть всі контейнери один на одного, накрийте кришкою та залиште на 3–4 дні." },
  { num: "04", title: "Поставте на світло", text: "Розмістіть контейнер на підвіконні з гарним освітленням." },
  { num: "05", title: "Збирайте урожай",    text: "Через 7–14 днів зріжте мікрозелень і насолоджуйтесь!" },
];

const foodItems: FoodItem[] = [
  { src: "/food-toasts.jpg",   label: "Тости" },
  { src: "/food-sandwich.jpg", label: "Сендвічі" },
  { src: "/food-tacos.jpg",    label: "Тако" },
  { src: "/food-soup.jpg",     label: "Супи" },
];

const benefits: Benefit[] = [
  { num: "01", title: "Висока поживна цінність", text: "У 4–40 разів більше нутрієнтів, ніж у дорослій рослині." },
  { num: "02", title: "Покращує смак страв",     text: "Яскравий, насичений смак для салатів, супів та сендвічів." },
  { num: "03", title: "Швидко і легко",           text: "Перший урожай за 7–14 днів без спеціального обладнання." },
  { num: "04", title: "Прикраса страв",           text: "Надає стравам ресторанний вигляд прямо вдома." },
  { num: "05", title: "Екологічність",            text: "Без пестицидів і ГМО. Тільки насіння, вода і світло." },
];

const navLinks = [
  { href: "#product",   label: "Продукт" },
  { href: "#varieties", label: "Склад набору" },
  { href: "#how-to",    label: "Як вирощувати" },
  { href: "#contact",   label: "Контакти" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  const [variant, setVariant] = useState<"simple" | "gift">("simple");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");

  // Meta Pixel — ViewContent при завантаженні
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_name: "Набір мікрозелені 10 врожаїв",
        content_ids: ["microgreen-tiger"],
        content_type: "product",
        currency: "UAH",
        value: 499,
      });
    }
  }, []);

  // Перевірка редиректу після оплати Monobank
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
      const savedInvoice = sessionStorage.getItem("invoiceId");
      const savedPrice = sessionStorage.getItem("orderPrice");
      if (savedInvoice) { setInvoiceId(savedInvoice); sessionStorage.removeItem("invoiceId"); }
      // Meta Pixel — Purchase
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          content_name: "Набір мікрозелені 10 врожаїв",
          content_ids: ["microgreen-tiger"],
          content_type: "product",
          currency: "UAH",
          value: savedPrice ? parseFloat(savedPrice) : 499,
        });
        if (savedPrice) sessionStorage.removeItem("orderPrice");
      }
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const body = new URLSearchParams({
        "form-name": "contact",
        ...formData,
      });
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
      if (res.ok) { setFormStatus("success"); setFormData({ name: "", phone: "", message: "" }); }
      else { setFormStatus("error"); }
    } catch { setFormStatus("error"); }
  };

  const featuresRef = useInView();
  const benefitsRef = useInView();
  const productRef  = useInView();
  const inspoRef    = useInView();
  const varietiesRef = useInView();
  const howToRef    = useInView();
  const contactRef  = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const price = variant === "gift" ? 549 : 499;
  const variantSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", backgroundColor: "#F5F2EB", color: "#1A1A14", minHeight: "100vh" }}>
      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled || menuOpen ? "rgba(245,242,235,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        transition: "all 0.4s ease",
        borderBottom: scrolled ? "1px solid #C8C4BB" : "none",
        padding: "0 clamp(16px, 5vw, 48px)",
        height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div className="nav-left" style={{ display: "flex", gap: "28px", whiteSpace: "nowrap", flex: 1 }}>
          <a href="#product"   style={s.navLink}>Продукт</a>
          <a href="#varieties" style={s.navLink}>Склад набору</a>
        </div>

        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(17px, 2vw, 22px)", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}>
          Грін гарден
        </div>

        <div className="nav-right" style={{ display: "flex", gap: "28px", whiteSpace: "nowrap", flex: 1, justifyContent: "flex-end" }}>
          <a href="#how-to"  style={s.navLink}>Як вирощувати</a>
          <a href="#contact" style={s.navLink}>Контакти</a>
        </div>

        <button className="burger" onClick={() => setMenuOpen(o => !o)}
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "8px", marginLeft: "16px" }}
          aria-label="Меню">
          <div style={{ width: 22, height: 2, backgroundColor: "#1A1A14", margin: "5px 0", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <div style={{ width: 22, height: 2, backgroundColor: "#1A1A14", margin: "5px 0", transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
          <div style={{ width: 22, height: 2, backgroundColor: "#1A1A14", margin: "5px 0", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: "fixed", top: "68px", left: 0, right: 0, bottom: 0, backgroundColor: "#F5F2EB", zIndex: 99, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "40px" }}>
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#1A1A14", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ paddingTop: "120px", paddingBottom: "80px", padding: "120px clamp(20px,6vw,100px) 80px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
            <div>
              <p style={{ ...s.label, opacity: 0, animation: "fadeInUp 0.8s ease 0.1s forwards" }}>Мікрозелень / Набір мікрозелені 10 врожаїв</p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px,6vw,78px)", fontWeight: 400, lineHeight: 1.05, marginBottom: "28px", opacity: 0, animation: "fadeInUp 0.8s ease 0.2s forwards" }}>
                Вирости своє<br /><em style={{ fontStyle: "italic", color: "#3B5040" }}>зелене</em> диво
              </h1>
              <p style={{ fontSize: "clamp(15px,1.4vw,17px)", lineHeight: 1.7, color: "#4A4A3A", maxWidth: "420px", marginBottom: "40px", opacity: 0, animation: "fadeInUp 0.8s ease 0.35s forwards" }}>
                Набір для вирощування мікрозелені з 10 видів насіння. Свіжа зелень прямо з підвіконня вже за 7–14 днів.
              </p>
              <div style={{ opacity: 0, animation: "fadeInUp 0.8s ease 0.5s forwards" }}>
                <a href="#variant-select" style={s.cta} onClick={e => { e.preventDefault(); variantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Замовити — {price} грн</a>
              </div>
            </div>
            <div style={{ position: "relative", opacity: 0, animation: "fadeIn 1s ease 0.3s forwards" }}>
              <img src="/harvest-scissors.jpg" alt="Зрізання мікрозелені"
                style={{ width: "100%", height: "clamp(280px,40vw,500px)", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: "-20px", left: "-20px", backgroundColor: "#3B5040", color: "#F5F2EB", padding: "18px 24px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: 600 }}>10</div>
                <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>видів зелені</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "56px clamp(20px,6vw,100px)" }} ref={featuresRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }}>
            {[
              { icon: "🌱", label: "Легко розпочати",   text: "Підходить навіть для початківців. Все є в комплекті." },
              { icon: "⏱",  label: "Швидкий результат", text: "Перший урожай вже через 7–14 днів після посіву." },
              { icon: "🏠",  label: "Вдома або в офісі", text: "Підходить для квартири, будинку, будь-якого простору." },
            ].map((f, i) => (
              <div key={f.label} style={{ borderLeft: "2px solid #C8C4BB", paddingLeft: "22px", opacity: featuresRef.inView ? 1 : 0, transform: featuresRef.inView ? "translateY(0)" : "translateY(30px)", transition: `all 0.6s ease ${i * 0.12}s` }}>
                <div style={{ fontSize: "22px", marginBottom: "10px" }}>{f.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "19px", marginBottom: "7px" }}>{f.label}</div>
                <div style={{ fontSize: "14px", color: "#6B6B5A", lineHeight: 1.6 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── BENEFITS ── */}
      <section style={{ padding: "96px clamp(20px,6vw,100px)" }} ref={benefitsRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "center" }}>
            <div style={{ opacity: benefitsRef.inView ? 1 : 0, transform: benefitsRef.inView ? "translateX(0)" : "translateX(-40px)", transition: "all 0.8s ease" }}>
              <img src="/benefits-bg.png" alt="Переваги мікрозелені"
                style={{ width: "100%", height: "clamp(300px,45vw,560px)", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ opacity: benefitsRef.inView ? 1 : 0, transform: benefitsRef.inView ? "translateX(0)" : "translateX(40px)", transition: "all 0.8s ease 0.2s" }}>
              <p style={s.label}>Чому мікрозелень?</p>
              <h2 style={s.sectionTitle}>Переваги<br /><em style={{ fontStyle: "italic", color: "#3B5040" }}>мікрозелені</em></h2>
              {benefits.map((b, i) => (
                <div key={b.num} style={{ display: "flex", gap: "18px", alignItems: "flex-start", paddingBottom: "18px", marginBottom: "18px", borderBottom: i < benefits.length - 1 ? "1px solid #C8C4BB" : "none" }}>
                  <div style={{ minWidth: "36px", height: "36px", backgroundColor: "#3B5040", color: "#F5F2EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>{b.num}</div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", marginBottom: "4px" }}>{b.title}</div>
                    <div style={{ fontSize: "14px", color: "#4A4A3A", lineHeight: 1.6 }}>{b.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── PRODUCT ── */}
      <section id="product" style={{ padding: "96px clamp(20px,6vw,100px)" }} ref={productRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "start" }}>
            <div style={{ opacity: productRef.inView ? 1 : 0, transform: productRef.inView ? "translateX(0)" : "translateX(-40px)", transition: "all 0.8s ease" }}>
              <img src="/hero-product.png" alt="Набір мікрозелені 10 врожаїв"
                style={{ width: "100%", height: "clamp(240px,34vw,420px)", objectFit: "cover", marginBottom: "14px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <img src="/microgreens-close.png" alt="Мікрозелень"
                  style={{ width: "100%", height: "clamp(110px,15vw,200px)", objectFit: "cover" }} />
                <img src="/seeds-flatlay.png" alt="Насіння"
                  style={{ width: "100%", height: "clamp(110px,15vw,200px)", objectFit: "cover" }} />
              </div>
            </div>

            <div style={{ opacity: productRef.inView ? 1 : 0, transform: productRef.inView ? "translateX(0)" : "translateX(40px)", transition: "all 0.8s ease 0.2s" }}>
              <p style={s.label}>Набір мікрозелені 10 врожаїв</p>
              <h2 style={s.sectionTitle}>Усе для вашого<br />першого врожаю</h2>
              <div style={{ backgroundColor: "#E8F0E4", padding: "24px", marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px", color: "#3B5040", fontWeight: 600 }}>Комплектація</div>
                {["Насіння 10 видів по 10г", "Льняний килимок для вирощування — 10 шт.", "Лоток 183×128мм — 10 шт.", "Інструкція по вирощуванню"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", fontSize: "14px" }}>
                    <div style={{ width: "5px", height: "5px", backgroundColor: "#3B5040", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #C8C4BB", fontSize: "12px", color: "#6B6B5A" }}>
                  Розмір: 34×24×10 см · Виробник: Україна
                </div>
              </div>

              <div id="variant-select" ref={variantSectionRef} style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px", color: "#6B6B5A" }}>Фасування насіння</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {([
                    { value: "simple", label: "Прозорий пакетик", sublabel: "для себе",     price: "499 грн" },
                    { value: "gift",   label: "Крафт-пакетик",    sublabel: "на подарунок", price: "549 грн" },
                  ] as const).map(opt => (
                    <button key={opt.value} onClick={() => setVariant(opt.value)}
                      style={{ padding: "14px", textAlign: "left", border: variant === opt.value ? "2px solid #3B5040" : "2px solid #C8C4BB", backgroundColor: variant === opt.value ? "#E8F0E4" : "transparent", cursor: "pointer", transition: "all 0.2s ease", fontFamily: "'Jost', sans-serif" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{opt.label}</div>
                      <div style={{ fontSize: "11px", color: "#6B6B5A", marginBottom: "7px" }}>{opt.sublabel}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: "#3B5040" }}>{opt.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "3px" }}>Ціна</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", fontWeight: 600 }}>{price} грн</div>
                </div>
                <button style={{ flex: 1, minWidth: "160px", backgroundColor: "#3B5040", color: "#F5F2EB", padding: "16px 24px", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background-color 0.3s ease" }}
                  onClick={() => {
                  if (typeof window !== "undefined" && (window as any).fbq) {
                    (window as any).fbq("track", "AddToCart", {
                      content_name: "Набір мікрозелені 10 врожаїв",
                      content_ids: ["microgreen-tiger"],
                      content_type: "product",
                      currency: "UAH",
                      value: price,
                    });
                  }
                  variantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => {
                    if (typeof window !== "undefined" && (window as any).fbq) {
                      (window as any).fbq("track", "InitiateCheckout", {
                        content_name: "Набір мікрозелені 10 врожаїв",
                        content_ids: ["microgreen-tiger"],
                        content_type: "product",
                        currency: "UAH",
                        value: price,
                        num_items: 1,
                      });
                    }
                    setCheckoutOpen(true);
                  }, 600);
                }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3B2F"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3B5040"; }}>
                  Купити зараз
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#3B5040" }} />
                <span style={{ fontSize: "13px", color: "#6B6B5A" }}>В наявності · Доставка по Україні</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section style={{ backgroundColor: "#1A1A14", padding: "96px clamp(20px,6vw,100px)", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,3.5vw,40px)", fontWeight: 400, color: "#F5F2EB", lineHeight: 1.4, fontStyle: "italic" }}>
            "Мікрозелень — це не просто рослина. Це щоденна турбота про себе і близьких."
          </p>
          <div style={{ width: "40px", height: "2px", backgroundColor: "#8AA68B", margin: "28px auto" }} />
          <p style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8AA68B" }}>Грін гарден</p>
        </div>
      </section>

      {/* ── FOOD INSPIRATION ── */}
      <section style={{ padding: "96px clamp(20px,6vw,100px)" }} ref={inspoRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={s.label}>Ідеї для страв</p>
            <h2 style={{ ...s.sectionTitle, marginBottom: "16px" }}>Додай у свою тарілку</h2>
            <p style={{ fontSize: "15px", color: "#4A4A3A", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
              Мікрозелень ідеально підходить до будь-якої страви — від тостів на сніданок до вечірніх супів.
            </p>
          </div>
          <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
            {foodItems.map((item, i) => (
              <div key={item.src} style={{ position: "relative", overflow: "hidden", opacity: inspoRef.inView ? 1 : 0, transform: inspoRef.inView ? "translateY(0)" : "translateY(40px)", transition: `all 0.6s ease ${i * 0.1}s` }}>
                <img src={item.src} alt={item.label}
                  style={{ width: "100%", height: "clamp(180px,20vw,300px)", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                  onMouseOver={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 18px 16px", background: "linear-gradient(to top, rgba(26,26,20,0.65) 0%, transparent 100%)" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#F5F2EB", fontStyle: "italic" }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── VARIETIES ── */}
      <section id="varieties" style={{ padding: "96px clamp(20px,6vw,100px)" }} ref={varietiesRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <p style={s.label}>10 у наборі</p>
            <h2 style={s.sectionTitle}>Склад набору</h2>
          </div>
          <div style={{ opacity: varietiesRef.inView ? 1 : 0, transform: varietiesRef.inView ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr", gap: "16px", padding: "10px 16px", borderBottom: "2px solid #1A1A14", marginBottom: "4px" }}>
              {["Вид", "До врожаю", "Користь"].map(h => (
                <div key={h} style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B5A" }}>{h}</div>
              ))}
            </div>
            {varieties.map((v, i) => (
              <div key={v.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr", gap: "16px", padding: "18px 16px", borderTop: "1px solid #C8C4BB", backgroundColor: i % 2 !== 0 ? "rgba(200,196,187,0.12)" : "transparent" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px" }}>{v.name}</div>
                <div style={{ fontSize: "13px", color: "#8AA68B" }}>{v.days}</div>
                <div style={{ fontSize: "14px", color: "#4A4A3A", lineHeight: 1.5 }}>{v.benefit}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #C8C4BB" }} />
          </div>
        </div>
      </section>

      {/* ── HOW TO ── */}
      <section id="how-to" style={{ backgroundColor: "#E8F0E4", padding: "96px clamp(20px,6vw,100px)" }} ref={howToRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={s.label}>Просто</p>
            <h2 style={s.sectionTitle}>Як вирощувати</h2>
          </div>
          <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "36px", marginBottom: "56px" }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ opacity: howToRef.inView ? 1 : 0, transform: howToRef.inView ? "translateY(0)" : "translateY(40px)", transition: `all 0.6s ease ${i * 0.1}s` }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "52px", color: "#C8C4BB", lineHeight: 1, marginBottom: "16px" }}>{step.num}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", marginBottom: "10px", fontWeight: 500 }}>{step.title}</h3>
                <p style={{ fontSize: "14px", color: "#4A4A3A", lineHeight: 1.7 }}>{step.text}</p>
              </div>
            ))}
          </div>
          <div style={{ opacity: howToRef.inView ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
            <img src="/harvest-scissors.jpg" alt="Збирання врожаю"
              style={{ width: "100%", height: "clamp(200px,28vw,400px)", objectFit: "cover", display: "block" }} />
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ backgroundColor: "#1A1A14", color: "#F5F2EB", padding: "96px clamp(20px,6vw,100px)" }} ref={contactRef.ref}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "start" }}>
            <div>
              <p style={{ ...s.label, color: "#8AA68B" }}>Зв'яжіться з нами</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,4vw,50px)", fontWeight: 400, lineHeight: 1.1, marginBottom: "40px", color: "#F5F2EB" }}>
                Маєте питання?<br />Ми поруч.
              </h2>
              {[
                { label: "Телефон",        value: "+38 093 059 95 00" },
                { label: "Email",          value: "info@gringardenua.com" },
                { label: "Графік роботи", value: "Пн–Нд: 10:00 – 19:00" },
              ].map(c => (
                <div key={c.label} style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "4px" }}>{c.label}</div>
                  <div style={{ fontSize: "17px" }}>{c.value}</div>
                </div>
              ))}
            </div>

            <form
              name="contact"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              onSubmit={handleFormSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <input type="hidden" name="form-name" value="contact" />
              <div style={{ display: "none" }}><input name="bot-field" /></div>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "6px" }}>Форма зворотного зв'язку</div>
              <input
                type="text" name="name" placeholder="Ваше ім'я" required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                style={s.darkInput}
              />
              <input
                type="tel" name="phone" placeholder="Телефон" required
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                style={s.darkInput}
              />
              <textarea
                name="message" placeholder="Ваше повідомлення" rows={4} required
                value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                style={{ ...s.darkInput, resize: "none" }}
              />
              {formStatus === "success" && (
                <div style={{ color: "#8AA68B", fontSize: "13px", letterSpacing: "0.05em" }}>
                  ✓ Дякуємо! Ми зв'яжемося з вами найближчим часом.
                </div>
              )}
              {formStatus === "error" && (
                <div style={{ color: "#c0392b", fontSize: "13px" }}>
                  Помилка відправки. Спробуйте ще раз.
                </div>
              )}
              <button type="submit"
                disabled={formStatus === "sending"}
                style={{ backgroundColor: "#3B5040", color: "#F5F2EB", padding: "15px 28px", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: formStatus === "sending" ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", alignSelf: "flex-start", transition: "background-color 0.3s ease", opacity: formStatus === "sending" ? 0.7 : 1 }}
                onMouseOver={e => { if (formStatus !== "sending") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8AA68B"; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3B5040"; }}>
                {formStatus === "sending" ? "Відправка..." : "Надіслати"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {paymentSuccess && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,26,20,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#F5F2EB", maxWidth: "480px", width: "100%", padding: "56px 48px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#E8F0E4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "28px" }}>✓</div>
            <p style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Замовлення оформлено</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 400, color: "#1A1A14", marginBottom: "16px", lineHeight: 1.3 }}>
              Дякуємо за ваше замовлення!
            </h2>
            <p style={{ fontSize: "15px", color: "#6B6B5A", lineHeight: 1.7, marginBottom: "12px" }}>
              Оплату успішно отримано. Ми вже готуємо ваш набір мікрозелені до відправки.
            </p>
            {invoiceId && (
              <div style={{ backgroundColor: "#E8F0E4", padding: "12px 20px", marginBottom: "16px", display: "inline-block" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "4px" }}>Номер вашого замовлення</div>
                <div style={{ fontSize: "16px", fontFamily: "'Jost', monospace", color: "#1A1A14", letterSpacing: "0.05em" }}>{invoiceId}</div>
              </div>
            )}
            <p style={{ fontSize: "14px", color: "#6B6B5A", lineHeight: 1.7, marginBottom: "32px" }}>
              Очікуйте на дзвінок від нашого менеджера для підтвердження деталей доставки.
            </p>
            <div style={{ width: "40px", height: "2px", backgroundColor: "#8AA68B", margin: "0 auto 32px" }} />
            <button
              onClick={() => setPaymentSuccess(false)}
              style={{ backgroundColor: "#3B5040", color: "#F5F2EB", padding: "15px 40px", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background-color 0.3s" }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3B2F"; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3B5040"; }}>
              Повернутись на сайт
            </button>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <Checkout
          variant={variant}
          price={price}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "#0E0E0A", padding: "32px clamp(20px,5vw,48px)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: "#F5F2EB" }}>Грін гарден</div>
          <a href="tel:+380675311952" style={{ fontSize: "14px", color: "#8AA68B", textDecoration: "none", letterSpacing: "0.05em" }}>+38 (067) 531-19-52</a>
          <div style={{ fontSize: "12px", color: "#6B6B5A" }}>© 2026 Грін гарден. Всі права захищені.</div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {["Доставка та оплата", "Повернення", "Конфіденційність"].map(l => (
              <a key={l} href="#" style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#6B6B5A", textDecoration: "none", textTransform: "uppercase" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(245,242,235,0.3); }

        @media (max-width: 768px) {
          .nav-left, .nav-right { display: none !important; }
          .burger { display: block !important; }
          .two-col   { grid-template-columns: 1fr !important; gap: 40px !important; }
          .three-col { grid-template-columns: 1fr !important; gap: 24px !important; }
          .four-col  { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .four-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  navLink: {
    fontSize: "clamp(11px,1.1vw,13px)", letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#1A1A14", textDecoration: "none", opacity: 0.7,
  },
  label: {
    fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase",
    color: "#8AA68B", marginBottom: "14px", display: "block",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px,4.5vw,52px)",
    fontWeight: 400, lineHeight: 1.1, marginBottom: "36px",
  },
  cta: {
    display: "inline-block", backgroundColor: "#3B5040", color: "#F5F2EB",
    padding: "16px 36px", fontSize: "13px", letterSpacing: "0.12em",
    textTransform: "uppercase", textDecoration: "none", fontWeight: 500,
    transition: "background-color 0.3s ease", fontFamily: "'Jost', sans-serif",
  },
  darkInput: {
    backgroundColor: "rgba(245,242,235,0.07)", border: "1px solid rgba(200,196,187,0.25)",
    color: "#F5F2EB", padding: "13px 16px", fontSize: "14px", outline: "none",
    fontFamily: "'Jost', sans-serif", width: "100%",
  },
};

function Divider() {
  return <div style={{ borderTop: "1px solid #C8C4BB", margin: "0 clamp(20px,6vw,100px)" }} />;
}

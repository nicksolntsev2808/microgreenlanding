import { useState, useEffect } from "react";

interface CheckoutProps {
  variant: "simple" | "gift";
  price: number;
  onClose: () => void;
}

type Carrier = "nova_poshta" | "ukrposhta";
type Payment = "card" | "cod";
type Step = "form" | "success";

const MONOBANK_TOKEN = "YOUR_MONOBANK_TOKEN"; // ← замінити після реєстрації

export default function Checkout({ variant, price, onClose }: CheckoutProps) {
  const [step, setStep] = useState<Step>("form");
  const [carrier, setCarrier] = useState<Carrier>("nova_poshta");
  const [payment, setPayment] = useState<Payment>("card");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [branch, setBranch] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Закрити по Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const variantLabel = variant === "simple" ? "Прозорий пакетик" : "Крафт-пакетик";
  const carrierLabel = carrier === "nova_poshta" ? "Нова пошта" : "Укрпошта";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim() || !city.trim() || !branch.trim()) {
      setError("Будь ласка, заповніть усі поля");
      return;
    }

    setLoading(true);

    if (payment === "cod") {
      // Оплата при отриманні — відправляємо на Netlify Forms
      try {
        const body = new URLSearchParams({
          "form-name": "checkout",
          name, phone, city, branch,
          carrier: carrierLabel,
          variant: variantLabel,
          price: `${price} грн`,
          payment: "Оплата при отриманні",
          comment,
        });
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        if (res.ok) { setStep("success"); }
        else { setError("Помилка відправки. Спробуйте ще раз."); }
      } catch {
        setError("Помилка відправки. Спробуйте ще раз.");
      } finally {
        setLoading(false);
      }
    } else {
      // Оплата картою — створюємо інвойс Monobank
      try {
        const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": MONOBANK_TOKEN,
          },
          body: JSON.stringify({
            amount: price * 100, // в копійках
            ccy: 980, // UAH
            merchantPaymInfo: {
              reference: `order-${Date.now()}`,
              destination: `Набір TIGER (${variantLabel})`,
              basketOrder: [{
                name: `Набір TIGER — ${variantLabel}`,
                qty: 1,
                sum: price * 100,
                icon: "",
                unit: "шт.",
              }],
            },
            redirectUrl: `${window.location.origin}/?payment=success`,
            webHookUrl: "", // опціонально
            comment: `${name}, ${phone}, ${carrierLabel}: ${city}, ${branch}. ${comment}`.trim(),
          }),
        });
        const data = await res.json();
        if (data.pageUrl) {
          window.location.href = data.pageUrl;
        } else {
          setError("Не вдалося створити платіж. Спробуйте ще раз.");
        }
      } catch {
        setError("Помилка підключення до платіжної системи.");
      } finally {
        setLoading(false);
      }
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontSize: "14px",
    border: "1px solid #C8C4BB", backgroundColor: "#FAFAF7",
    fontFamily: "'Jost', sans-serif", outline: "none", boxSizing: "border-box",
    color: "#1A1A14",
  };

  const radioCard = (active: boolean): React.CSSProperties => ({
    border: active ? "2px solid #3B5040" : "2px solid #C8C4BB",
    backgroundColor: active ? "#E8F0E4" : "#FAFAF7",
    padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: "10px",
    fontFamily: "'Jost', sans-serif", width: "100%", textAlign: "left",
  });

  if (step === "success") {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,26,20,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#F5F2EB", maxWidth: "420px", width: "100%", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 400, marginBottom: "12px", color: "#1A1A14" }}>
            Замовлення прийнято!
          </h2>
          <p style={{ fontSize: "14px", color: "#6B6B5A", lineHeight: 1.6, marginBottom: "28px" }}>
            Ми зв'яжемося з вами найближчим часом для підтвердження замовлення.
          </p>
          <button onClick={onClose} style={{ backgroundColor: "#3B5040", color: "#F5F2EB", padding: "14px 32px", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
            Повернутись
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,26,20,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
      <div style={{ backgroundColor: "#F5F2EB", maxWidth: "520px", width: "100%", marginTop: "40px", marginBottom: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid #C8C4BB" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 400, color: "#1A1A14", margin: 0 }}>
            Оформлення замовлення
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#6B6B5A", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
          {/* Товар */}
          <div style={{ backgroundColor: "#EDE9DF", padding: "16px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "4px" }}>Ваше замовлення</div>
              <div style={{ fontSize: "15px", color: "#1A1A14" }}>Набір TIGER — {variantLabel}</div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#3B5040", fontWeight: 600 }}>{price} грн</div>
          </div>

          {/* Контакти */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Контактні дані</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input style={inp} type="text" placeholder="Ім'я та прізвище" value={name} onChange={e => setName(e.target.value)} required />
              <input style={inp} type="tel" placeholder="Телефон (+38...)" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          {/* Доставка — перевізник */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Доставка</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {([
                { value: "nova_poshta", label: "Нова пошта", sub: "За тарифами перевізника" },
                { value: "ukrposhta",   label: "Укрпошта",   sub: "За тарифами перевізника" },
              ] as const).map(c => (
                <button key={c.value} type="button" onClick={() => setCarrier(c.value)} style={radioCard(carrier === c.value)}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: carrier === c.value ? "5px solid #3B5040" : "2px solid #C8C4BB", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#1A1A14", fontWeight: carrier === c.value ? 600 : 400 }}>{c.label}</div>
                    <div style={{ fontSize: "11px", color: "#6B6B5A" }}>{c.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input style={inp} type="text" placeholder="Місто" value={city} onChange={e => setCity(e.target.value)} required />
              <input style={inp} type="text" placeholder={carrier === "nova_poshta" ? "Відділення або поштомат №" : "Поштовий індекс / відділення"} value={branch} onChange={e => setBranch(e.target.value)} required />
            </div>
          </div>

          {/* Оплата */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Оплата</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {([
                { value: "card", label: "Онлайн — карткою", sub: "Безпечна оплата через Monobank" },
                { value: "cod",  label: "Оплата при отриманні", sub: "Накладений платіж" },
              ] as const).map(p => (
                <button key={p.value} type="button" onClick={() => setPayment(p.value)} style={radioCard(payment === p.value)}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: payment === p.value ? "5px solid #3B5040" : "2px solid #C8C4BB", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#1A1A14", fontWeight: payment === p.value ? 600 : 400 }}>{p.label}</div>
                    <div style={{ fontSize: "11px", color: "#6B6B5A" }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Коментар */}
          <div style={{ marginBottom: "24px" }}>
            <textarea
              style={{ ...inp, resize: "none" }} rows={3}
              placeholder="Коментар до замовлення (необов'язково)"
              value={comment} onChange={e => setComment(e.target.value)}
            />
          </div>

          {error && <div style={{ color: "#c0392b", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

          {/* Підсумок + кнопка */}
          <div style={{ borderTop: "1px solid #C8C4BB", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "#6B6B5A", letterSpacing: "0.05em" }}>До сплати</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#1A1A14", fontWeight: 600 }}>{price} грн</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", backgroundColor: "#3B5040", color: "#F5F2EB", padding: "16px", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", transition: "background-color 0.3s", opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3B2F"; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3B5040"; }}
            >
              {loading ? "Обробка..." : payment === "card" ? "Оплатити карткою →" : "Підтвердити замовлення →"}
            </button>
            {payment === "card" && (
              <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px", color: "#8AA68B", letterSpacing: "0.05em" }}>
                Захищено Monobank · SSL шифрування
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

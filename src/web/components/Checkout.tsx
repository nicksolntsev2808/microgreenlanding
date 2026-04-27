import { useState, useEffect, useRef } from "react";

interface CheckoutProps {
  variant: "simple" | "gift";
  price: number;
  onClose: () => void;
}

type Carrier = "nova_poshta" | "ukrposhta";
type Payment = "card" | "cod";
type Step = "form" | "success";

const NP_API_KEY = "9f1e4307f82a41e8988d5baf2a1218a7";

interface NpCity { Ref: string; Description: string; }
interface NpWarehouse { Ref: string; Description: string; }

export default function Checkout({ variant, price, onClose }: CheckoutProps) {
  const [step, setStep] = useState<Step>("form");
  const [carrier, setCarrier] = useState<Carrier>("nova_poshta");
  const [payment, setPayment] = useState<Payment>("card");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  // Нова пошта — пошук міста
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<NpCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<NpCity | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Нова пошта — відділення
  const [warehouses, setWarehouses] = useState<NpWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<NpWarehouse | null>(null);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);

  // Укрпошта — прості поля
  const [upCity, setUpCity] = useState("");
  const [upBranch, setUpBranch] = useState("");

  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const warehouseRef = useRef<HTMLDivElement>(null);

  // Закрити по Escape та scroll lock
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  // Закрити дропдауни при кліку поза
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCities(false);
      if (warehouseRef.current && !warehouseRef.current.contains(e.target as Node)) setShowWarehouses(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Пошук міст НП з debounce
  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    if (cityTimer.current) clearTimeout(cityTimer.current);
    cityTimer.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: NP_API_KEY,
            modelName: "Address",
            calledMethod: "getCities",
            methodProperties: { FindByString: cityQuery, Limit: 7 },
          }),
        });
        const data = await res.json();
        setCities(data.data || []);
        setShowCities(true);
      } catch { setCities([]); }
      finally { setCityLoading(false); }
    }, 400);
  }, [cityQuery]);

  // Завантаження відділень після вибору міста
  useEffect(() => {
    if (!selectedCity) { setWarehouses([]); return; }
    setWarehouseLoading(true);
    setSelectedWarehouse(null);
    setWarehouseQuery("");
    fetch("https://api.novaposhta.ua/v2.0/json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: NP_API_KEY,
        modelName: "AddressGeneral",
        calledMethod: "getWarehouses",
        methodProperties: { CityRef: selectedCity.Ref, Limit: 500 },
      }),
    })
      .then(r => r.json())
      .then(data => { setWarehouses(data.data || []); })
      .catch(() => setWarehouses([]))
      .finally(() => setWarehouseLoading(false));
  }, [selectedCity]);

  const filteredWarehouses = warehouses.filter(w =>
    w.Description.toLowerCase().includes(warehouseQuery.toLowerCase())
  );

  const variantLabel = variant === "simple" ? "Прозорий пакетик" : "Крафт-пакетик";
  const carrierLabel = carrier === "nova_poshta" ? "Нова пошта" : "Укрпошта";

  const getDeliveryAddress = () => {
    if (carrier === "nova_poshta") {
      return `${selectedCity?.Description || ""}, ${selectedWarehouse?.Description || ""}`;
    }
    return `${upCity}, ${upBranch}`;
  };

  const isFormValid = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) return false;
    if (carrier === "nova_poshta") return !!(selectedCity && selectedWarehouse);
    return !!(upCity.trim() && upBranch.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isFormValid()) { setError("Будь ласка, заповніть усі поля"); return; }
    setLoading(true);

    if (payment === "cod") {
      try {
        const orderRef = `cod-${Date.now()}`;
        const fullComment = `${lastName} ${firstName} ${middleName}, ${phone}, ${email}, ${carrierLabel}: ${getDeliveryAddress()}. ${comment}`.trim();

        // Netlify Forms
        const formBody = new URLSearchParams({
          "form-name": "checkout",
          name: `${lastName} ${firstName} ${middleName}`.trim(), phone, email,
          carrier: carrierLabel,
          address: getDeliveryAddress(),
          variant: variantLabel,
          price: `${price} грн`,
          payment: "Оплата при отриманні",
          comment,
        });
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody.toString(),
        });

        // Telegram уведомление
        await fetch("/api/notify-cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRef, amount: price, comment: fullComment }),
        });

        if (res.ok) {
          setInvoiceId(orderRef);
          setStep("success");
        } else {
          setError("Помилка відправки. Спробуйте ще раз.");
        }
      } catch { setError("Помилка відправки. Спробуйте ще раз."); }
      finally { setLoading(false); }
    } else {
      try {
        const res = await fetch("/api/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: price * 100,
            ccy: 980,
            merchantPaymInfo: {
              reference: `order-${Date.now()}`,
              destination: `Набір мікрозелені 10 врожаїв (${variantLabel})`,
              basketOrder: [{ name: `Набір мікрозелені 10 врожаїв — ${variantLabel}`, qty: 1, sum: price * 100, unit: "шт." }],
            },
            redirectUrl: `${window.location.origin}/?payment=success`,
            comment: `${lastName} ${firstName} ${middleName}, ${phone}, ${email}, ${carrierLabel}: ${getDeliveryAddress()}. ${comment}`.trim(),
          }),
        });
        const data = await res.json();
        console.log("Monobank response:", JSON.stringify(data));
        if (data.pageUrl) {
          if (data.invoiceId) sessionStorage.setItem('invoiceId', data.invoiceId);
          window.location.href = data.pageUrl;
        }
        else setError(`Помилка: ${data.errText || data.error || JSON.stringify(data)}`);
      } catch (err) { 
        console.error("Fetch error:", err);
        setError(`Помилка з'єднання: ${err}`); 
      }
      finally { setLoading(false); }
    }
  };

  // ── Стилі ──
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "11px", letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#6B6B5A", marginBottom: "6px", fontFamily: "'Jost', sans-serif",
  };
  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontSize: "14px",
    border: "1px solid #C8C4BB", backgroundColor: "#FAFAF7",
    fontFamily: "'Jost', sans-serif", outline: "none", boxSizing: "border-box", color: "#1A1A14",
  };
  const radioCard = (active: boolean): React.CSSProperties => ({
    border: active ? "2px solid #3B5040" : "2px solid #C8C4BB",
    backgroundColor: active ? "#E8F0E4" : "#FAFAF7",
    padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: "10px",
    fontFamily: "'Jost', sans-serif", width: "100%", textAlign: "left",
  });
  const dropdownItem: React.CSSProperties = {
    padding: "10px 14px", cursor: "pointer", fontSize: "13px",
    color: "#1A1A14", borderBottom: "1px solid #EDE9DF",
  };

  if (step === "success") {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,26,20,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#F5F2EB", maxWidth: "420px", width: "100%", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 400, marginBottom: "12px", color: "#1A1A14" }}>Замовлення прийнято!</h2>
          {invoiceId && (
            <div style={{ backgroundColor: "#E8F0E4", padding: "12px 20px", marginBottom: "16px", display: "inline-block" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "4px" }}>Номер вашого замовлення</div>
              <div style={{ fontSize: "15px", fontFamily: "'Jost', monospace", color: "#1A1A14", letterSpacing: "0.05em" }}>{invoiceId}</div>
            </div>
          )}
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
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 400, color: "#1A1A14", margin: 0 }}>Оформлення замовлення</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#6B6B5A", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "32px" }}>

          {/* Товар */}
          <div style={{ backgroundColor: "#EDE9DF", padding: "16px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "4px" }}>Ваше замовлення</div>
              <div style={{ fontSize: "15px", color: "#1A1A14" }}>Набір мікрозелені 10 врожаїв — {variantLabel}</div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#3B5040", fontWeight: 600 }}>{price} грн</div>
          </div>

          {/* Контакти */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Контактні дані</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={lbl}>Ім'я *</label>
                <input style={inp} type="text" placeholder="Введіть ім'я" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>Прізвище *</label>
                <input style={inp} type="text" placeholder="Введіть прізвище" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>По батькові</label>
                <input style={inp} type="text" placeholder="Введіть по батькові" value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Телефон *</label>
                <input style={inp} type="tel" placeholder="+38 (0__) ___-__-__" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input style={inp} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Перевізник */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8AA68B", marginBottom: "12px" }}>Доставка</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {([
                { value: "nova_poshta", label: "Нова пошта", sub: "За тарифами перевізника" },
                { value: "ukrposhta",   label: "Укрпошта",   sub: "За тарифами перевізника" },
              ] as const).map(c => (
                <button key={c.value} type="button" onClick={() => { setCarrier(c.value); setSelectedCity(null); setCityQuery(""); setSelectedWarehouse(null); }} style={radioCard(carrier === c.value)}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: carrier === c.value ? "5px solid #3B5040" : "2px solid #C8C4BB", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#1A1A14", fontWeight: carrier === c.value ? 600 : 400 }}>{c.label}</div>
                    <div style={{ fontSize: "11px", color: "#6B6B5A" }}>{c.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Нова пошта — пошук */}
            {carrier === "nova_poshta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Місто */}
                <div ref={cityRef} style={{ position: "relative" }}>
                  <label style={lbl}>Місто *</label>
                  <input
                    style={inp} type="text" placeholder="Почніть вводити назву міста..."
                    value={cityQuery}
                    onChange={e => { setCityQuery(e.target.value); setSelectedCity(null); setSelectedWarehouse(null); }}
                    onFocus={() => { if (cities.length > 0) setShowCities(true); }}
                    autoComplete="off"
                  />
                  {cityLoading && <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "#8AA68B" }}>...</div>}
                  {showCities && cities.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #C8C4BB", zIndex: 100, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      {cities.map(city => (
                        <div key={city.Ref} style={dropdownItem}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#E8F0E4"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = ""; }}
                          onMouseDown={() => { setSelectedCity(city); setCityQuery(city.Description); setShowCities(false); }}>
                          {city.Description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Відділення */}
                {selectedCity && (
                  <div ref={warehouseRef} style={{ position: "relative" }}>
                    <label style={lbl}>Відділення або поштомат *</label>
                    <input
                      style={{ ...inp, backgroundColor: warehouseLoading ? "#f0f0ed" : "#FAFAF7" }}
                      type="text"
                      placeholder={warehouseLoading ? "Завантаження відділень..." : "Введіть номер або адресу відділення..."}
                      value={warehouseQuery}
                      onChange={e => { setWarehouseQuery(e.target.value); setSelectedWarehouse(null); setShowWarehouses(true); }}
                      onFocus={() => setShowWarehouses(true)}
                      disabled={warehouseLoading}
                      autoComplete="off"
                    />
                    {selectedWarehouse && !showWarehouses && (
                      <div style={{ fontSize: "11px", color: "#3B5040", marginTop: "4px", paddingLeft: "4px" }}>✓ {selectedWarehouse.Description}</div>
                    )}
                    {showWarehouses && filteredWarehouses.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #C8C4BB", zIndex: 100, maxHeight: "220px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                        {filteredWarehouses.map(w => (
                          <div key={w.Ref} style={dropdownItem}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#E8F0E4"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = ""; }}
                            onMouseDown={() => { setSelectedWarehouse(w); setWarehouseQuery(w.Description); setShowWarehouses(false); }}>
                            {w.Description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Укрпошта — прості поля */}
            {carrier === "ukrposhta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={lbl}>Місто *</label>
                  <input style={inp} type="text" placeholder="Введіть місто" value={upCity} onChange={e => setUpCity(e.target.value)} required />
                </div>
                <div>
                  <label style={lbl}>Поштовий індекс або відділення *</label>
                  <input style={inp} type="text" placeholder="Напр. 65000 або відділення №5" value={upBranch} onChange={e => setUpBranch(e.target.value)} required />
                </div>
              </div>
            )}
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
            <textarea style={{ ...inp, resize: "none" }} rows={3}
              placeholder="Коментар до замовлення (необов'язково)"
              value={comment} onChange={e => setComment(e.target.value)} />
          </div>

          {error && <div style={{ color: "#c0392b", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

          {/* Підсумок + кнопка */}
          <div style={{ borderTop: "1px solid #C8C4BB", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "#6B6B5A" }}>До сплати</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#1A1A14", fontWeight: 600 }}>{price} грн</span>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", backgroundColor: "#3B5040", color: "#F5F2EB", padding: "16px", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", transition: "background-color 0.3s", opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3B2F"; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3B5040"; }}>
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

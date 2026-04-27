export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = process.env.MONOBANK_TOKEN;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    return new Response(JSON.stringify({ error: "Token not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Додаємо webhook URL для отримання статусу оплати
    const invoiceBody = {
      ...body,
      webHookUrl: `${new URL(req.url).origin}/api/monobank-webhook`,
    };

    const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": token,
      },
      body: JSON.stringify(invoiceBody),
    });

    const data = await response.json();

    // Одразу повідомляємо в Telegram що замовлення створено (ще не оплачено)
    if (data.invoiceId && TELEGRAM_TOKEN && CHAT_ID) {
      const comment = body.comment || "—";
      const amount = (body.amount / 100).toFixed(0);
      const message = `🛒 *Нове замовлення створено*\n\n` +
        `🆔 Invoice: \`${data.invoiceId}\`\n` +
        `💰 Сума: *${amount} грн*\n` +
        `📝 ${comment}\n` +
        `⏳ Очікує оплати...`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/create-invoice" };

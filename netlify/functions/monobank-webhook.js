const orderStore = globalThis.orderStore || (globalThis.orderStore = new Map());

export default async (req, context) => {
  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const data = await req.json();

    if (data.status !== "success") {
      return new Response("OK", { status: 200 });
    }

    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const amount = (data.amount / 100).toFixed(0);
    const invoiceId = data.invoiceId || "—";

    // Витягуємо збережені дані замовлення
    const orderData = orderStore.get(invoiceId);
    const comment = orderData?.comment || data.comment || "—";

    const message = `✅ *Нове замовлення оплачено!*\n\n` +
      `🆔 Invoice: \`${invoiceId}\`\n` +
      `💰 Сума: *${amount} грн*\n` +
      `📋 Деталі замовлення:\n${comment}\n` +
      `🕐 Час: ${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kiev" })}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    // Видаляємо з пам'яті після успішної оплати
    orderStore.delete(invoiceId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
};

export const config = { path: "/api/monobank-webhook" };

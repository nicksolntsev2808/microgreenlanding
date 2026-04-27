export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const { orderRef, amount, comment } = await req.json();

    const message = `🆕 *Нове замовлення (накладений платіж)*\n\n` +
      `🆔 Номер: \`${orderRef}\`\n` +
      `💰 Сума: *${amount} грн*\n` +
      `📋 Деталі:\n${comment}\n` +
      `💳 Оплата: при отриманні\n` +
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("COD notify error:", err);
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
};

export const config = { path: "/api/notify-cod" };

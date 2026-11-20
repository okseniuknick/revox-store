export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Allow': 'POST' }
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'Server configuration is incomplete' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  let order;
  try {
    order = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const name = String(order.name || '').trim().slice(0, 100);
  const phone = String(order.phone || '').trim().slice(0, 40);
  const address = String(order.address || '').trim().slice(0, 300);
  const product = String(order.product || 'Power Bank K86').trim().slice(0, 100);
  const quantity = Number(order.quantity);
  const unitPrice = 2399;

  if (!name || !phone || !address || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return new Response(JSON.stringify({ ok: false, error: 'Please check the order fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const total = quantity * unitPrice;
  const message = [
    '🛒 НОВЕ ЗАМОВЛЕННЯ REVOX',
    '',
    `👤 Ім’я: ${name}`,
    `📞 Телефон: ${phone}`,
    `📦 Товар: ${product}`,
    `🔢 Кількість: ${quantity}`,
    `💰 Сума: ${total.toLocaleString('uk-UA')} грн`,
    `📍 Адреса доставки: ${address}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Telegram delivery failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Could not contact Telegram' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};

import { Order } from "../types";
import { formatINR } from "./utils";

export function buildWhatsAppMessage(order: Order): string {
  const dateStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(order.created_at || Date.now()));

  let itemsList = '';
  order.items.forEach((item, index) => {
    const itemTotal = item.quantity * (order.payment_method === 'prepaid' ? item.prepaid_price : item.our_price);
    itemsList += `${index + 1}. ${item.name}
   Qty: ${item.quantity} × ${formatINR(order.payment_method === 'prepaid' ? item.prepaid_price : item.our_price)} = ${formatINR(itemTotal)}\n`;
  });

  const paymentDetails = order.payment_method === 'prepaid'
    ? `Method: ✅ Full Prepaid
Prepaid Discount: −₹1,000 per item
*Amount to Pay: ${formatINR(order.final_amount)}*
Savings vs Amazon: ${formatINR(order.savings_amount || 0)}`
    : `Method: 🚚 Half COD
Advance (Pay Now): ${formatINR(order.advance_amount || 0)}
Remaining on Delivery: ${formatINR(order.remaining_amount || 0)}
*Total Amount: ${formatINR(order.final_amount)}*
Savings vs Amazon: ${formatINR(order.savings_amount || 0)}`;

  const message = `🛍️ *NEW ORDER — NEXTALL*
━━━━━━━━━━━━━━━━━━━━━━

📋 *Order ID:* ${order.order_number}
📅 *Date:* ${dateStr}

👤 *Customer:*
Name: ${order.customer_name}
Phone: ${order.customer_phone}
${order.customer_email ? `Email: ${order.customer_email}` : ''}

📦 *Order Items:*
${itemsList}
💰 *Payment:*
${paymentDetails}

📍 *Delivery Address:*
${order.customer_address}
${order.customer_city}, ${order.customer_state} — ${order.customer_pincode}

💬 *Please confirm this order and share payment details. Thank you!*`;

  return message;
}

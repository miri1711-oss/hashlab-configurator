import { sql } from "@vercel/postgres";

export interface OrderRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  shippingMethod: string;
  packetaPointName: string | null;
  paymentMethod: string;
  fileName: string;
  materialName: string;
  colorLabel: string;
  hasCustomPaint: boolean;
  infillLabel: string;
  quantity: number;
  totalPrice: number;
  // "cod" - dobierka, netreba online platbu
  // "pending_payment" - karta, cakame na Stripe potvrdenie
  // "paid" - Stripe potvrdil uspesnu platbu (nastavuje to webhook)
  status: string;
}

let tableEnsured = false;

async function ensureOrdersTable() {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      zip TEXT NOT NULL,
      shipping_method TEXT NOT NULL,
      packeta_point_name TEXT,
      payment_method TEXT NOT NULL,
      file_name TEXT NOT NULL,
      material_name TEXT NOT NULL,
      color_label TEXT NOT NULL,
      has_custom_paint BOOLEAN NOT NULL DEFAULT false,
      infill_label TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_price NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `;
  // Pre pripad, ze tabulka uz existovala z predoslej verzie bez stlpca status.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';`;
  tableEnsured = true;
}

export async function insertOrder(order: OrderRecord) {
  await ensureOrdersTable();
  await sql`
    INSERT INTO orders (
      id, full_name, email, phone, street, city, zip,
      shipping_method, packeta_point_name, payment_method,
      file_name, material_name, color_label, has_custom_paint,
      infill_label, quantity, total_price, status
    ) VALUES (
      ${order.id}, ${order.fullName}, ${order.email}, ${order.phone},
      ${order.street}, ${order.city}, ${order.zip},
      ${order.shippingMethod}, ${order.packetaPointName}, ${order.paymentMethod},
      ${order.fileName}, ${order.materialName}, ${order.colorLabel}, ${order.hasCustomPaint},
      ${order.infillLabel}, ${order.quantity}, ${order.totalPrice}, ${order.status}
    )
    ON CONFLICT (id) DO NOTHING;
  `;
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureOrdersTable();
  await sql`UPDATE orders SET status = ${status} WHERE id = ${id};`;
}

export async function listOrders() {
  await ensureOrdersTable();
  const result = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200;`;
  return result.rows;
}

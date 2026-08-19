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
  modelFileUrl: string | null;
  paintPreviewUrl: string | null;
  coloredThreeMFUrl: string | null;
  materialName: string;
  colorLabel: string;
  hasCustomPaint: boolean;
  infillLabel: string;
  layerHeightLabel: string;
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
  // Pre pripad, ze tabulka uz existovala z predoslej verzie bez niektoreho stlpca.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS model_file_url TEXT;`;
  // Stav v tlacovej fronte - nezavisly od stavu platby. "pending" = caka na
  // spracovanie automatizacnym skriptom pri tlaciarni, "sent_to_printer" =
  // subor uz bol poslany do tlaciarne a caka na clovka, aby zalozil filament
  // a spustil tlac.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_status TEXT NOT NULL DEFAULT 'pending';`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS layer_height_label TEXT NOT NULL DEFAULT '0.2 mm';`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paint_preview_url TEXT;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS colored_threemf_url TEXT;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS packeta_barcode TEXT;`;
  tableEnsured = true;
}

let authTablesEnsured = false;

async function ensureAuthTables() {
  if (authTablesEnsured) return;
  // Prihlasovacie odkazy poslane emailom zakaznikovi (magic link, bez hesla).
  await sql`
    CREATE TABLE IF NOT EXISTS magic_links (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false
    );
  `;
  authTablesEnsured = true;
}

export async function createMagicLink(token: string, email: string, expiresAt: Date) {
  await ensureAuthTables();
  await sql`
    INSERT INTO magic_links (token, email, expires_at)
    VALUES (${token}, ${email}, ${expiresAt.toISOString()});
  `;
}

/**
 * Kolko prihlasovacich odkazov bolo pre tento email vytvorenych za
 * poslednych `sinceMinutesAgo` minut - pouziva sa na obmedzenie
 * (rate limit), aby niekto nemohol niekomu spamovat schranku opakovanymi
 * ziadostami o prihlasenie.
 */
export async function countRecentMagicLinks(email: string, sinceMinutesAgo: number): Promise<number> {
  await ensureAuthTables();
  const result = await sql`
    SELECT COUNT(*)::int AS count FROM magic_links
    WHERE email = ${email}
      AND created_at > now() - (${sinceMinutesAgo} || ' minutes')::interval;
  `;
  return result.rows[0]?.count ?? 0;
}

/**
 * Overi token, oznaci ho ako pouzity (jednorazovy) a vrati email, na ktory
 * bol vystaveny - alebo null, ak je neplatny/expirovany/uz pouzity.
 */
export async function consumeMagicLink(token: string): Promise<string | null> {
  await ensureAuthTables();
  const result = await sql`
    UPDATE magic_links
    SET used = true
    WHERE token = ${token}
      AND used = false
      AND expires_at > now()
    RETURNING email;
  `;
  return result.rows[0]?.email ?? null;
}

/**
 * Objednavky konkretneho zakaznika podla emailu, na "Moje objednavky".
 * Vyuziva uz existujuci stlpec email na objednavke - netreba samostatnu
 * tabulku pouzivatelov ani prepajanie cudzim klucom.
 */
export async function listOrdersByEmail(email: string) {
  await ensureOrdersTable();
  const result = await sql`
    SELECT * FROM orders WHERE email = ${email} ORDER BY created_at DESC LIMIT 100;
  `;
  return result.rows;
}

export async function insertOrder(order: OrderRecord) {
  await ensureOrdersTable();
  await sql`
    INSERT INTO orders (
      id, full_name, email, phone, street, city, zip,
      shipping_method, packeta_point_name, payment_method,
      file_name, model_file_url, paint_preview_url, colored_threemf_url, material_name, color_label, has_custom_paint,
      infill_label, layer_height_label, quantity, total_price, status
    ) VALUES (
      ${order.id}, ${order.fullName}, ${order.email}, ${order.phone},
      ${order.street}, ${order.city}, ${order.zip},
      ${order.shippingMethod}, ${order.packetaPointName}, ${order.paymentMethod},
      ${order.fileName}, ${order.modelFileUrl}, ${order.paintPreviewUrl}, ${order.coloredThreeMFUrl}, ${order.materialName}, ${order.colorLabel}, ${order.hasCustomPaint},
      ${order.infillLabel}, ${order.layerHeightLabel}, ${order.quantity}, ${order.totalPrice}, ${order.status}
    )
    ON CONFLICT (id) DO NOTHING;
  `;
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureOrdersTable();
  await sql`UPDATE orders SET status = ${status} WHERE id = ${id};`;
}

export async function updatePrintStatus(id: string, printStatus: string) {
  await ensureOrdersTable();
  await sql`UPDATE orders SET print_status = ${printStatus} WHERE id = ${id};`;
}

export async function updatePacketaBarcode(id: string, barcode: string) {
  await ensureOrdersTable();
  await sql`UPDATE orders SET packeta_barcode = ${barcode} WHERE id = ${id};`;
}

let printerStatusTableEnsured = false;

async function ensurePrinterStatusTable() {
  if (printerStatusTableEnsured) return;
  // Jeden riadok = jedna tlaciaren. "id" je vlastny nazov tlaciarne
  // (napr. "hlavna"), aby sa dala neskor jednoducho pridat druha.
  await sql`
    CREATE TABLE IF NOT EXISTS printer_status (
      id TEXT PRIMARY KEY,
      is_printing BOOLEAN NOT NULL DEFAULT false,
      current_job_name TEXT,
      progress_percent INTEGER,
      ams_slots_json TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  printerStatusTableEnsured = true;
}

export interface AmsSlot {
  slot: number;
  materialType: string; // napr. "PLA", "PETG"
  colorHex: string; // napr. "#FF0000"
  remainingPercent: number | null;
}

export interface PrinterStatusUpdate {
  printerId: string;
  isPrinting: boolean;
  currentJobName: string | null;
  progressPercent: number | null;
  amsSlots: AmsSlot[];
}

export async function upsertPrinterStatus(status: PrinterStatusUpdate) {
  await ensurePrinterStatusTable();
  await sql`
    INSERT INTO printer_status (id, is_printing, current_job_name, progress_percent, ams_slots_json, updated_at)
    VALUES (
      ${status.printerId}, ${status.isPrinting}, ${status.currentJobName},
      ${status.progressPercent}, ${JSON.stringify(status.amsSlots)}, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      is_printing = EXCLUDED.is_printing,
      current_job_name = EXCLUDED.current_job_name,
      progress_percent = EXCLUDED.progress_percent,
      ams_slots_json = EXCLUDED.ams_slots_json,
      updated_at = now();
  `;
}

export async function listPrinterStatuses() {
  await ensurePrinterStatusTable();
  const result = await sql`SELECT * FROM printer_status ORDER BY id;`;
  return result.rows;
}

export async function listOrders() {
  await ensureOrdersTable();
  const result = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200;`;
  return result.rows;
}

export async function getOrderById(id: string) {
  await ensureOrdersTable();
  const result = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1;`;
  return result.rows[0] ?? null;
}

/**
 * Objednávky pripravené na tlač - zaplatené (alebo dobierka) a ešte
 * neposlané do tlačovej fronty. Toto číta automatizačný skript pri
 * tlačiarni namiesto ručného prehľadávania všetkých objednávok.
 */
export async function listPrintQueue() {
  await ensureOrdersTable();
  const result = await sql`
    SELECT * FROM orders
    WHERE print_status = 'pending'
      AND status IN ('paid', 'cod')
      AND model_file_url IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 50;
  `;
  return result.rows;
}

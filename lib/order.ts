export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
}

export type ShippingMethod = "courier" | "packeta" | "packeta_domov" | "pickup";
export type PaymentMethod = "card" | "cod";

export interface ShippingOption {
  id: ShippingMethod;
  label: string;
  description: string;
  price: number;
}

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "courier", label: "Kuriér", description: "Doručenie na adresu, 1-2 pracovné dni", price: 4.9 },
  {
    id: "packeta",
    label: "Výdajné miesto (Packeta)",
    description: "Zvoľte si výdajné miesto Packeta/Zásielkovňa",
    price: 3.5,
  },
  {
    id: "packeta_domov",
    label: "Packeta domov",
    description: "Doručenie na adresu cez Packetu, do druhého dňa",
    price: 3.9,
  },
  { id: "pickup", label: "Osobný odber", description: "hashlab.sk, Spišská Nová Ves", price: 0 },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "card", label: "Platobná karta", description: "Online platba kartou (Visa, Mastercard...)" },
  { id: "cod", label: "Dobierka", description: "Platba pri prevzatí" },
];

// Znaky bez zamenitelnych dvojic (O/0, I/1, ...), aby sa cislo objednavky
// dalo bez chyby precitat aj rucne prepisat, ale zaroven bolo prakticky
// neuhadnutelne - povodna verzia mala len 9000 moznych kombinacii, co bolo
// realne skusitelne postupnym vyskusanim.
const ORDER_NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ORDER_NUMBER_CHARS[Math.floor(Math.random() * ORDER_NUMBER_CHARS.length)];
  }
  return `HL-${y}-${code}`;
}

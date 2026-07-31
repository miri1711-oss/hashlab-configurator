export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
}

export type ShippingMethod = "courier" | "packeta" | "pickup";
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
  { id: "pickup", label: "Osobný odber", description: "hashlab.sk, Spišská Nová Ves", price: 0 },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "card", label: "Platobná karta", description: "Online platba kartou (Visa, Mastercard...)" },
  { id: "cod", label: "Dobierka", description: "Platba pri prevzatí" },
];

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HL-${y}-${rand}`;
}

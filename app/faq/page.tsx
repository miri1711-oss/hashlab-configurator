"use client";

import { useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Aké formáty súborov môžem nahrať?",
    answer:
      "Podporujeme .stl, .obj a .step/.stp súbory. Živý 3D náhľad, presný výpočet rozmerov aj maľovanie farieb sú dostupné pre .stl a .obj - pri .step sa použije odhad rozmerov.",
  },
  {
    question: "Aké materiály ponúkate a na čo sa hodia?",
    answer:
      "Štandardný plast (PLA) - bežné modely a prototypy. Odolný plast (PETG) - mechanicky namáhané diely. Exteriér & Teplo (ASA) - UV a teplotná odolnosť, vhodné von. Pružný gumený (TPU) - ohybné, nárazuvzdorné diely. Ultra Detail (Resin) - najvyššia presnosť a hladkosť povrchu.",
  },
  {
    question: "Čo znamená výška vrstvy a ktorú si mám vybrať?",
    answer:
      "Výška vrstvy určuje, ako jemne je model vytlačený. Štandardná (0,2 mm) je odporúčaná voľba pre väčšinu modelov - dobrý pomer rýchlosti a kvality. Hrubšia (0,28 mm) je rýchlejšia, ale vrstvy sú viac viditeľné. Jemnejšia (0,12 mm) dáva najhladší povrch, tlač ale trvá dlhšie.",
  },
  {
    question: "Čo znamená výplň (pevnosť) modelu?",
    answer:
      "Výplň určuje, koľko materiálu je vo vnútri modelu, nie len na povrchu. Ľahká (15 %) je najlacnejšia a najľahšia, vhodná na dekoratívne modely. Štandardná (30 %) je bežná voľba. Pevná (80 %) je najodolnejšia, ale aj najťažšia a najdrahšia.",
  },
  {
    question: "Dá sa model vytlačiť vo viacerých farbách?",
    answer:
      "Áno - po nahratí .stl alebo .obj modelu môžete zapnúť \"Viac farieb na modeli\" a kliknutím priamo na model vyfarbiť konkrétne časti (napr. QR kód inou farbou ako podstavec). Vybraná plocha sa rozšíri aj na jej bezprostredné okolie (napr. bočné steny), nie len na plochý povrch.",
  },
  {
    question: "Aké spôsoby dopravy a platby si môžem vybrať?",
    answer:
      "Doprava: kuriér, výdajné miesto (Packeta) alebo osobný odber. Platba: kartou online, alebo dobierkou (platba pri prevzatí).",
  },
  {
    question: "Ako dlho trvá výroba a doručenie?",
    answer:
      "Bežný odhad doručenia je približne 4 dni od objednávky - presný dátum uvidíte priamo pri objednávke pred jej dokončením.",
  },
  {
    question: "Je nejaká minimálna cena objednávky?",
    answer:
      "Áno, minimálna cena objednávky je 4,90 €. Pri väčšom počte kusov (5 a viac) sa navyše uplatní zľava na celkovú cenu.",
  },
  {
    question: "Dostanem potvrdenie objednávky?",
    answer:
      "Áno, po dokončení objednávky vám automaticky príde potvrdenie emailom so súhrnom (materiál, farba, výplň, výška vrstvy, cena). Pri platbe kartou príde potvrdenie po úspešnom spracovaní platby, pri dobierke hneď po objednaní.",
  },
  {
    question: "Mám inú otázku - čo teraz?",
    answer: "Napíšte nám cez kontaktný formulár, ozveme sa vám čo najskôr.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundDecoration />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/"
            className="text-sm font-semibold text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
          >
            ← Späť na konfigurátor
          </a>
        </div>

        <div className="card rounded-2xl p-5 sm:p-7">
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Často kladené otázky</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">
            Odpovede na to, čo zákazníkov najčastejšie zaujíma.
          </p>

          <div className="flex flex-col gap-2">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-xl border border-[var(--border)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--surface-2)]"
                  >
                    {item.question}
                    <span
                      className={`shrink-0 text-[var(--text-3)] transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border)] px-4 py-3 text-sm leading-relaxed text-[var(--text-3)]">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-[var(--text-3)]">
            Nenašli ste odpoveď?{" "}
            <a href="/kontakt" className="font-semibold text-[var(--blue-2)] hover:underline">
              Napíšte nám
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

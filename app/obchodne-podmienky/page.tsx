import BackgroundDecoration from "@/components/BackgroundDecoration";

export default function TermsPage() {
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
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Obchodné podmienky</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">
            Podmienky nákupu na Hashlab.sk.
          </p>

          <div className="flex flex-col gap-5 text-sm leading-relaxed text-[var(--text-2)]">
            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">1. Predávajúci</h2>
              <p>
                [DOPLNIŤ: Obchodné meno], so sídlom [DOPLNIŤ: adresa], IČO: [DOPLNIŤ], DIČ:
                [DOPLNIŤ], [DOPLNIŤ: IČ DPH, ak je platca] (ďalej len „predávajúci").
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                2. Objednávka a uzavretie zmluvy
              </h2>
              <p>
                Objednávka sa vytvára nahratím 3D modelu, konfiguráciou (materiál, farba, výplň,
                výška vrstvy) a odoslaním v poslednom kroku. Kúpna zmluva vzniká potvrdením
                objednávky zo strany predávajúceho (odoslaním potvrdzujúceho e-mailu).
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">3. Cena a platba</h2>
              <p>
                Cena je vypočítaná automaticky podľa objemu modelu, materiálu a zvolenej výplne a
                je zobrazená pred dokončením objednávky vrátane DPH (ak je predávajúci platcom
                DPH). Platiť je možné platobnou kartou online alebo na dobierku pri prevzatí.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                4. Dodacie podmienky
              </h2>
              <p>
                Tovar doručujeme kuriérom, na výdajné miesto Packeta, alebo je možný osobný
                odber. Orientačný termín doručenia je zobrazený pri objednávke; keďže ide o
                zákazkovú výrobu na mieru, presný termín sa môže líšiť podľa vyťaženosti.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                5. Odstúpenie od zmluvy
              </h2>
              <p>
                [DOPLNIŤ: Keďže ide o tovar vyrobený podľa osobitných požiadaviek spotrebiteľa /
                na mieru (§ 7 ods. 6 písm. c) zákona č. 102/2014 Z.z.), spotrebiteľ v takom prípade
                nemôže odstúpiť od zmluvy do 14 dní. Toto ustanovenie odporúčame overiť s
                právnikom podľa konkrétneho charakteru ponúkaných produktov.]
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                6. Reklamácie
              </h2>
              <p>
                [DOPLNIŤ: Postup a podmienky uplatnenia reklamácie, kontaktné údaje na
                reklamačné oddelenie, odkaz na reklamačný poriadok.]
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                7. Ochrana osobných údajov
              </h2>
              <p>
                Spracúvanie osobných údajov upravujú samostatné{" "}
                <a href="/ochrana-udajov" className="font-semibold text-[var(--blue-2)] hover:underline">
                  Zásady ochrany osobných údajov
                </a>
                .
              </p>
            </section>

            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Toto je pracovný návrh textu, nie je to hotová právna dokumentácia. Pred zverejnením
              odporúčame dať obsah skontrolovať právnikom alebo účtovníkom, najmä miesta označené
              [DOPLNIŤ] a bod o odstúpení od zmluvy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

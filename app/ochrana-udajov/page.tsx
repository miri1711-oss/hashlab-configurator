import BackgroundDecoration from "@/components/BackgroundDecoration";

export default function PrivacyPolicyPage() {
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
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">
            Ochrana osobných údajov
          </p>
          <p className="mb-6 text-sm text-[var(--text-3)]">
            Informácie o tom, aké údaje spracúvame a prečo.
          </p>

          <div className="prose-legal flex flex-col gap-5 text-sm leading-relaxed text-[var(--text-2)]">
            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">1. Prevádzkovateľ</h2>
              <p>
                [DOPLNIŤ: Obchodné meno], so sídlom [DOPLNIŤ: adresa], IČO: [DOPLNIŤ], zapísaná v
                [DOPLNIŤ: napr. Živnostenskom registri / Obchodnom registri OS ...] (ďalej len
                „prevádzkovateľ" alebo „my"). Kontakt: [DOPLNIŤ email], [DOPLNIŤ telefón].
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                2. Aké osobné údaje spracúvame
              </h2>
              <p>Pri vytvorení objednávky spracúvame:</p>
              <ul className="ml-4 mt-1 list-disc space-y-0.5">
                <li>meno a priezvisko</li>
                <li>e-mailová adresa</li>
                <li>telefónne číslo</li>
                <li>doručovacia adresa (ulica, mesto, PSČ)</li>
                <li>obsah objednávky (nahraný 3D model, zvolený materiál, farba, cena)</li>
                <li>platobné údaje spracúva priamo platobná brána Stripe - my čísla platobných kariet nevidíme ani neukladáme</li>
              </ul>
              <p className="mt-2">
                Pri vyplnení kontaktného formulára spracúvame meno, e-mail a obsah vašej správy.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                3. Účel a právny základ spracúvania
              </h2>
              <p>
                Údaje z objednávky spracúvame za účelom jej vybavenia a doručenia (plnenie zmluvy).
                Kontaktné údaje z formulára spracúvame za účelom vybavenia vašej otázky (oprávnený
                záujem / plnenie predzmluvných vzťahov).
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                4. Komu údaje sprístupňujeme (spracovatelia)
              </h2>
              <p>Na prevádzku e-shopu využívame tieto služby tretích strán:</p>
              <ul className="ml-4 mt-1 list-disc space-y-0.5">
                <li>Vercel - hosting webstránky a ukladanie nahratých 3D modelov</li>
                <li>Neon - databáza objednávok</li>
                <li>Stripe - spracovanie platieb kartou</li>
                <li>Resend - odosielanie e-mailov (potvrdenia objednávok, odpovede na kontaktný formulár)</li>
                <li>Packeta - doručenie na výdajné miesto (ak je zvolené ako spôsob dopravy)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">
                5. Doba uchovávania
              </h2>
              <p>
                [DOPLNIŤ: napr. Údaje z objednávok uchovávame po dobu vyžadovanú účtovnou a
                daňovou legislatívou (zvyčajne 10 rokov). Kontaktné správy uchovávame po dobu
                nevyhnutnú na vybavenie otázky.]
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 text-sm font-bold text-[var(--text-1)]">6. Vaše práva</h2>
              <p>
                Máte právo na prístup k svojim osobným údajom, ich opravu, vymazanie, obmedzenie
                spracúvania, prenosnosť a právo namietať proti spracúvaniu. Svoje práva si môžete
                uplatniť na [DOPLNIŤ email]. Máte tiež právo podať sťažnosť Úradu na ochranu
                osobných údajov SR.
              </p>
            </section>

            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Toto je pracovný návrh textu, nie je to hotová právna dokumentácia. Pred zverejnením
              odporúčame dať obsah skontrolovať právnikom alebo účtovníkom, najmä miesta označené
              [DOPLNIŤ].
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

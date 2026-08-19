// Klient na oficialne Packeta SOAP API (createPacket) - pouziva sa na
// vytvorenie skutocnej zasielky "Packeta domov" (dorucenie na adresu cez
// Packetu). Nie je to reverzne inzinierovane - je to zdokumentovane API
// (docs.packeta.com), rovnake API pouzivaju vsetky oficialne pluginy pre
// e-shopy.

const PACKETA_SOAP_ENDPOINT = "http://www.zasilkovna.cz/api/soap.wsdl";

export interface PacketaHomeDeliveryOrder {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  totalPriceEur: number;
  codAmountEur: number | null; // suma na dobierku, null ak nie je dobierka
}

export interface PacketaShipmentResult {
  ok: boolean;
  barcode?: string;
  packetId?: string;
  error?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

/**
 * Vytvori skutocnu zasielku "Packeta domov" (dorucenie priamo na adresu,
 * nie na vydajne miesto) cez oficialne SOAP API. Vyzaduje PACKETA_API_PASSWORD
 * (z client.packeta.com - pole "API heslo", NIE "API kluc") a
 * PACKETA_HOME_CARRIER_ID (cislo dopravcu pre "Packeta domov" - najdes ho vo
 * svojom Packeta ucte v nastaveni dopravcov, alebo sa spytaj ich podpory).
 */
export async function createPacketaHomeDeliveryShipment(
  order: PacketaHomeDeliveryOrder
): Promise<PacketaShipmentResult> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  const carrierId = process.env.PACKETA_HOME_CARRIER_ID;

  if (!apiPassword || !carrierId) {
    console.error("Chyba PACKETA_API_PASSWORD alebo PACKETA_HOME_CARRIER_ID v prostredi.");
    return { ok: false, error: "Packeta API nie je nakonfigurovane." };
  }

  const [name, ...surnameParts] = order.fullName.trim().split(" ");
  const surname = surnameParts.join(" ") || name;

  const codTag = order.codAmountEur != null ? `<cod>${order.codAmountEur.toFixed(2)}</cod>` : "";

  const requestXml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://www.zasilkovna.cz/api/soap.wsdl">
  <soapenv:Header/>
  <soapenv:Body>
    <soap:createPacket>
      <apiPassword>${escapeXml(apiPassword)}</apiPassword>
      <packetAttributes>
        <number>${escapeXml(order.orderNumber)}</number>
        <name>${escapeXml(name)}</name>
        <surname>${escapeXml(surname)}</surname>
        <email>${escapeXml(order.email)}</email>
        <phone>${escapeXml(order.phone)}</phone>
        <carrierId>${escapeXml(carrierId)}</carrierId>
        <street>${escapeXml(order.street)}</street>
        <city>${escapeXml(order.city)}</city>
        <zip>${escapeXml(order.zip)}</zip>
        ${codTag}
        <value>${order.totalPriceEur.toFixed(2)}</value>
        <currency>EUR</currency>
        <eshop>hashlab.sk</eshop>
      </packetAttributes>
    </soap:createPacket>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await fetch(PACKETA_SOAP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "createPacket",
      },
      body: requestXml,
    });

    const responseText = await response.text();

    if (responseText.includes("soapenv:Fault") || responseText.includes("<faultstring>")) {
      const faultMessage = extractTag(responseText, "faultstring") ?? "Neznama chyba z Packeta API.";
      console.error("Packeta createPacket chyba:", faultMessage);
      return { ok: false, error: faultMessage };
    }

    const packetId = extractTag(responseText, "id");
    const barcode = extractTag(responseText, "barcode");

    if (!packetId) {
      console.error("Packeta createPacket - neocakavana odpoved:", responseText.slice(0, 500));
      return { ok: false, error: "Neocakavana odpoved z Packeta API." };
    }

    return { ok: true, packetId, barcode: barcode ?? undefined };
  } catch (error) {
    console.error("Packeta createPacket - chyba siete:", error);
    return { ok: false, error: "Chyba pri komunikacii s Packeta API." };
  }
}

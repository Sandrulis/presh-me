/**
 * Hand-maintained intent page strings per locale (no machine API).
 * Run: node scripts/build-intent-locale-files.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const en = JSON.parse(fs.readFileSync(path.join(root, "scripts/intent-en-keys.json"), "utf8"));
const outDir = path.join(root, "scripts/i18n-intent-locales");
fs.mkdirSync(outDir, { recursive: true });

/** @type {Record<string, Record<string, string>>} */
const locales = {
  lv: {
    "intent.portfolio_website.kicker": "Portfolio",
    "intent.portfolio_website.h1": "Portfolio mājaslapa vienā linkā",
    "intent.portfolio_website.lead":
      "Parādi izvēlētos darbus, īsu bio un kontaktu — bez pilnas daudzlappu vietnes. Ieliec linku e-pastā, Instagram vai piedāvājumos.",
    "intent.portfolio_website.meta_title": "Portfolio mājaslapas veidotājs",
    "intent.portfolio_website.meta_description":
      "Izveido tīru vienas lapas portfolio Presh.Me — darbi, saites un kontakts vienā adresē.",
    "intent.portfolio_website.bullet1": "Attēlu, teksta, video un CV bloki darbu paraugiem.",
    "intent.portfolio_website.bullet2": "Tēmas un fonti, kas atbilst tavam amatam, nevis šablona fabrikai.",
    "intent.portfolio_website.bullet3": "Viena stabila adrese: atjauno studijā; bio links paliek tas pats.",
    "intent.digital_business_card.kicker": "Digitālā kartīte",
    "intent.digital_business_card.h1": "Digitālā vizītkarte, ko patiešām atver",
    "intent.digital_business_card.lead":
      "Aizvieto papīra kartīšu kaudzi ar vienu lapu: kas tu esi, ko piedāvā un kā sazināties. Dalies ar linku vai QR uz to pašu adresi.",
    "intent.digital_business_card.meta_title": "Digitālā vizītkarte",
    "intent.digital_business_card.meta_description":
      "Izveido digitālo vizītkarti Presh.Me — vārds, pakalpojumi, rezervācija un sociālie vienā lapā.",
    "intent.digital_business_card.bullet1": "Profils, pakalpojumu saites, tālrunis/e-pasts un sociālās ikonas vienuviet.",
    "intent.digital_business_card.bullet2": "Atjauno darba laikus vai piedāvājumus studijā — kartītes links nemainās.",
    "intent.digital_business_card.bullet3": "Mobilajā ierīcē vispirms; apmeklētājiem nav vajadzīga lietotne.",
    "intent.personal_website.kicker": "Personīgā lapa",
    "intent.personal_website.h1": "Personīgā mājaslapa bez sarežģītas uzstādīšanas",
    "intent.personal_website.lead":
      "Ja vajag publisku klātbūtni, bet ne CMS, sāc ar vienu pārstrādātu lapu. Pievieno sadaļas, augot — joprojām viens links.",
    "intent.personal_website.meta_title": "Personīgās mājaslapas veidotājs",
    "intent.personal_website.meta_description":
      "Vienkārša personīgā lapa Presh.Me — stāsts, saites un kontakts bez hostinga raizēm.",
    "intent.personal_website.bullet1": "Teksta, mediju un FAQ bloki skaidram stāstam.",
    "intent.personal_website.bullet2": "Publicē, kad gatavs; melnraksts nav redzams, kamēr nepublicē.",
    "intent.personal_website.bullet3": "Tas pats rīks kā link in bio — nav jāmācās otrs produkts.",
    "intent.for_barbers.kicker": "Frizierei",
    "intent.for_barbers.h1": "Rezervācija un sociālie vienā salona linkā",
    "intent.for_barbers.lead":
      "Klientiem nevajag meklēt rezervācijas URL stāstos. Vienā lapā — rezervācija, cenas, Instagram un adrese.",
    "intent.for_barbers.meta_title": "Link in bio friziereiem",
    "intent.for_barbers.meta_description":
      "Rezervācija, Instagram un veikala saites vienā Presh.Me lapā frizieriem.",
    "intent.for_barbers.bullet1": "Pogas rezervācijas lietotnēm, WhatsApp vai tālrunim.",
    "intent.for_barbers.bullet2": "Foto un teksta bloki pakalpojumiem un darba laikam.",
    "intent.for_barbers.bullet3": "Dalies kā bio links vai QR pie krēsla.",
    "intent.for_barbers.nav": "Friziereiem",
    "intent.for_beauty_professionals.kicker": "Skaistumam",
    "intent.for_beauty_professionals.h1": "Pakalpojumi un rezervācija bez bio haosa",
    "intent.for_beauty_professionals.lead":
      "Ēdienkarte, rezervācija un pirms/pēc saites vienā lapā no Instagram vai QR reģistratūrā.",
    "intent.for_beauty_professionals.meta_title": "Link in bio skaistumam",
    "intent.for_beauty_professionals.meta_description":
      "Pakalpojumi, rezervācija un galerija vienā Presh.Me lapā saloniem.",
    "intent.for_beauty_professionals.bullet1": "Pakalpojumu izvēlne un rezervācijas saites vienā pieskārienā.",
    "intent.for_beauty_professionals.bullet2": "Pirms/pēc vai galerijas bloki uzticamībai.",
    "intent.for_beauty_professionals.bullet3": "QR reģistratūrā; tas pats links bio.",
    "intent.for_coaches.kicker": "Treneri",
    "intent.for_coaches.h1": "Programmas un rezervācija vienā lapā",
    "intent.for_coaches.lead":
      "No sociālajiem postiem uz skaidru lapu: kam palīgi, kā rezervēt un ko sagaidīt — bez garas mājaslapas.",
    "intent.for_coaches.meta_title": "Link in bio treneriem",
    "intent.for_coaches.meta_description":
      "Programmas, rezervācija un FAQ vienā Presh.Me lapā treneriem.",
    "intent.for_coaches.bullet1": "Skaidrs piedāvājums, atsauksmes un rezervācija vienā plūsmā.",
    "intent.for_coaches.bullet2": "FAQ un teksta bloki programmām.",
    "intent.for_coaches.bullet3": "Viens links no postiem, stāstiem un e-pasta paraksta.",
    "intent.for_content_creators.kicker": "Satura veidotāji",
    "intent.for_content_creators.h1": "Visas platformas aiz viena bio linka",
    "intent.for_content_creators.lead":
      "Instagram, TikTok vai YouTube uz lapu ar jaunāko video, podkāstu, veikalu un jaunumiem — bez bio pārpildes.",
    "intent.for_content_creators.meta_title": "Link in bio satura veidotājiem",
    "intent.for_content_creators.meta_description":
      "YouTube, Spotify, veikals un sociālie vienā Presh.Me lapā.",
    "intent.for_content_creators.bullet1": "YouTube, Spotify un saišu bloki aktuālajiem relīziem.",
    "intent.for_content_creators.bullet2": "Tēmas, kas mobilajā ir salasāmas.",
    "intent.for_content_creators.bullet3": "Maini izceltās saites; handle paliek tas pats.",
    "intent.for_designers.kicker": "Dizaineri",
    "intent.for_designers.h1": "Izvēlēti darbi bez smagas vietnes",
    "intent.for_designers.lead":
      "Koncentrēta lapa case study, Behance/Dribbble saitēm un jautājumiem — izskatās kā tu, nevis šablons.",
    "intent.for_designers.meta_title": "Link in bio dizaineriem",
    "intent.for_designers.meta_description":
      "Portfolio un kontakts vienā Presh.Me lapā dizaineriem.",
    "intent.for_designers.bullet1": "Case study bloki un saites uz Behance vai Dribbble.",
    "intent.for_designers.bullet2": "Tipogrāfija un tēmas tavam zīmolam.",
    "intent.for_designers.bullet3": "Viens URL piedāvājumiem, bio un e-pastam.",
    "intent.for_freelancers.kicker": "Brīvie speciālisti",
    "intent.for_freelancers.h1": "Viena lapa klientiem un bio",
    "intent.for_freelancers.lead":
      "Beidz likt piecas dažādas saites DM. Pakalpojumi, pierādījumi un nākamais solis vienā adresē.",
    "intent.for_freelancers.meta_title": "Link in bio brīvniekiem",
    "intent.for_freelancers.meta_description":
      "Pakalpojumi, portfolio un kontakts vienā Presh.Me lapā.",
    "intent.for_freelancers.bullet1": "Pakalpojumi, pierādījumi un kontakts bez piecu linku.",
    "intent.for_freelancers.bullet2": "CV vai projektu bloki uzticamībai.",
    "intent.for_freelancers.bullet3": "Atjauno piedāvājumus studijā; bio links nemainās.",
    "intent.for_photographers.kicker": "Fotogrāfi",
    "intent.for_photographers.h1": "Viens links portfolio un rezervācijai",
    "intent.for_photographers.lead":
      "Galerijas, cenas un kontakts vienā URL Instagram, e-pastam un QR drukā.",
    "intent.for_photographers.meta_title": "Link in bio fotogrāfiem",
    "intent.for_photographers.meta_description":
      "Portfolio, rezervācija un sociālie vienā Presh.Me lapā fotogrāfiem.",
    "intent.for_photographers.bullet1": "Attēlu un galeriju bloki izvēlētiem darbiem.",
    "intent.for_photographers.bullet2": "Rezervācijas, printu vai veikala pogas — bez reklāmām bio.",
    "intent.for_photographers.bullet3": "Atjauno lapu studijā; handle paliek.",
    "intent.for_small_businesses.kicker": "Mazie uzņēmumi",
    "intent.for_small_businesses.h1": "Publiska lapa darba laikam, ēdienkartei un rezervācijai",
    "intent.for_small_businesses.lead":
      "Kad jautā „kāds links?”, dod vienu adresi ar karti, Instagram, pasūtīšanu un kontaktu — no telefona.",
    "intent.for_small_businesses.meta_title": "Link in bio mazajiem uzņēmumiem",
    "intent.for_small_businesses.meta_description":
      "Darba laiks, ēdienkarte, karte un sociālie vienā Presh.Me lapā.",
    "intent.for_small_businesses.bullet1": "Karte, laiki, ēdienkartes PDF un pasūtīšana kopā.",
    "intent.for_small_businesses.bullet2": "Instagram un tālruņa pogas, ko lieto klienti.",
    "intent.for_small_businesses.bullet3": "Labo no telefona; klienti vienmēr saņem jaunāko linku.",
    "intent.for_small_businesses.nav": "Mazajiem uzņēmumiem",
    "intent.common.back_presh": "← Presh.Me",
    "intent.common.link_in_bio": "Link in bio",
  },
  da: {
    "intent.portfolio_website.kicker": "Portfolio",
    "intent.portfolio_website.h1": "En portfoliohjemmeside i ét link",
    "intent.portfolio_website.lead":
      "Vis udvalgt arbejde, en kort bio og kontakt — uden en tung flersidet site. Brug linket i mail, Instagram eller tilbud.",
    "intent.portfolio_website.meta_title": "Portfoliohjemmeside",
    "intent.portfolio_website.meta_description":
      "Byg en ren én-sides portfolio på Presh.Me — arbejder, links og kontakt på én URL.",
    "intent.portfolio_website.bullet1": "Billede-, tekst-, video- og CV-blokke til cases.",
    "intent.portfolio_website.bullet2": "Temaer og skrifttyper der matcher dit fag.",
    "intent.portfolio_website.bullet3": "Én stabil adresse: opdater i studiet; bio-linket er det samme.",
    "intent.digital_business_card.kicker": "Digitalt kort",
    "intent.digital_business_card.h1": "Et digitalt visitkort folk faktisk åbner",
    "intent.digital_business_card.lead":
      "Erstat papirkort med én side: hvem du er, hvad du tilbyder, og hvordan man kontakter dig. Del linket eller en QR.",
    "intent.digital_business_card.meta_title": "Digitalt visitkort",
    "intent.digital_business_card.meta_description":
      "Lav et digitalt visitkort på Presh.Me — navn, services, booking og sociale medier på én side.",
    "intent.digital_business_card.bullet1": "Profil, service-links, telefon/e-mail og sociale ikoner samlet.",
    "intent.digital_business_card.bullet2": "Opdater åbningstider i studiet — kort-linket er uændret.",
    "intent.digital_business_card.bullet3": "Mobil først; besøgende behøver ingen app.",
    "intent.personal_website.kicker": "Personlig site",
    "intent.personal_website.h1": "Personlig hjemmeside uden opsætningsbesvær",
    "intent.personal_website.lead":
      "Har du brug for en offentlig side men ikke et CMS, start med én poleret side. Tilføj sektioner efterhånden — stadig ét link.",
    "intent.personal_website.meta_title": "Personlig hjemmeside",
    "intent.personal_website.meta_description":
      "En enkel personlig side på Presh.Me — din historie, links og kontakt uden hosting-stress.",
    "intent.personal_website.bullet1": "Tekst-, medie- og FAQ-blokke til din fortælling.",
    "intent.personal_website.bullet2": "Publicér når du er klar; kladde er skjult indtil publicering.",
    "intent.personal_website.bullet3": "Samme værktøj som link-in-bio — intet nyt at lære.",
    "intent.for_barbers.kicker": "Barbere",
    "intent.for_barbers.h1": "Booking og sociale medier i ét butikslink",
    "intent.for_barbers.lead":
      "Kunder skal ikke lede i stories efter booking-URL. Én side med booking, prisliste, Instagram og adresse.",
    "intent.for_barbers.meta_title": "Link in bio til barbere",
    "intent.for_barbers.meta_description":
      "Booking, Instagram og shop-links på én Presh.Me-side til barbere.",
    "intent.for_barbers.bullet1": "Knapper til booking-apps, WhatsApp eller telefon.",
    "intent.for_barbers.bullet2": "Foto- og tekstblokke til ydelser og åbningstid.",
    "intent.for_barbers.bullet3": "Del som bio-link eller QR ved stolen.",
    "intent.for_barbers.nav": "Til barbere",
    "intent.for_beauty_professionals.kicker": "Skønhed",
    "intent.for_beauty_professionals.h1": "Ydelser og booking uden bio-kaos",
    "intent.for_beauty_professionals.lead":
      "Menu, booking og før/efter-links på én side fra Instagram eller QR i receptionen.",
    "intent.for_beauty_professionals.meta_title": "Link in bio til skønhed",
    "intent.for_beauty_professionals.meta_description":
      "Ydelser, booking og galleri på én Presh.Me-side til saloner.",
    "intent.for_beauty_professionals.bullet1": "Ydelsesmenu og booking-links med ét tryk.",
    "intent.for_beauty_professionals.bullet2": "Før/efter- eller galleriblokke.",
    "intent.for_beauty_professionals.bullet3": "QR i receptionen; samme link i bio.",
    "intent.for_coaches.kicker": "Coaches",
    "intent.for_coaches.h1": "Programmer og booking på én delbar side",
    "intent.for_coaches.lead":
      "Før folk fra opslag til en klar side: hvem du hjælper, booking og forventninger — uden stort website-projekt.",
    "intent.for_coaches.meta_title": "Link in bio til coaches",
    "intent.for_coaches.meta_description":
      "Programmer, booking og FAQ på én Presh.Me-side.",
    "intent.for_coaches.bullet1": "Tydeligt tilbud, testimonials og booking.",
    "intent.for_coaches.bullet2": "FAQ- og tekstblokke til programmer.",
    "intent.for_coaches.bullet3": "Ét link fra opslag, stories og mailsignatur.",
    "intent.for_content_creators.kicker": "Creators",
    "intent.for_content_creators.h1": "Alle platforme bag ét bio-link",
    "intent.for_content_creators.lead":
      "Peg Instagram, TikTok eller YouTube til en side med seneste video, podcast, shop og nyhedsbrev — uden at proppe bioen.",
    "intent.for_content_creators.meta_title": "Link in bio til creators",
    "intent.for_content_creators.meta_description":
      "YouTube, Spotify, shop og sociale på én Presh.Me-side.",
    "intent.for_content_creators.bullet1": "YouTube-, Spotify- og linkblokke til det aktuelle.",
    "intent.for_content_creators.bullet2": "Temaer der er læsbare på mobil.",
    "intent.for_content_creators.bullet3": "Skift fremhævede links; behold samme handle.",
    "intent.for_designers.kicker": "Designere",
    "intent.for_designers.h1": "Vis udvalgt arbejde uden tung site",
    "intent.for_designers.lead":
      "En fokuseret side til cases, Behance/Dribbble og henvendelser — føles som dig, ikke en skabelon.",
    "intent.for_designers.meta_title": "Link in bio til designere",
    "intent.for_designers.meta_description":
      "Portfolio og kontakt på én Presh.Me-side til designere.",
    "intent.for_designers.bullet1": "Case-blokke og links til Behance eller Dribbble.",
    "intent.for_designers.bullet2": "Typografi og temaer der matcher dit brand.",
    "intent.for_designers.bullet3": "Én URL til tilbud, bio og mail.",
    "intent.for_freelancers.kicker": "Freelancere",
    "intent.for_freelancers.h1": "Én side til kunder og bio",
    "intent.for_freelancers.lead":
      "Stop med at sende fem URL'er i DM. Ydelser, beviser og næste skridt fra én adresse.",
    "intent.for_freelancers.meta_title": "Link in bio til freelancere",
    "intent.for_freelancers.meta_description":
      "Services, portfolio og kontakt på én Presh.Me-side.",
    "intent.for_freelancers.bullet1": "Services, cases og kontakt uden fem links.",
    "intent.for_freelancers.bullet2": "CV- eller projektblokke for troværdighed.",
    "intent.for_freelancers.bullet3": "Opdater tilbud i studiet; bio-link uændret.",
    "intent.for_photographers.kicker": "Fotografer",
    "intent.for_photographers.h1": "Ét link til portfolio og booking",
    "intent.for_photographers.lead":
      "Gallerier, priser og kontakt på én URL til Instagram, mails og QR på tryk.",
    "intent.for_photographers.meta_title": "Link in bio til fotografer",
    "intent.for_photographers.meta_description":
      "Portfolio, booking og sociale på én Presh.Me-side.",
    "intent.for_photographers.bullet1": "Billed- og galleriblokke til udvalgt arbejde.",
    "intent.for_photographers.bullet2": "Booking-, print- eller shop-knapper — uden reklamer i bio.",
    "intent.for_photographers.bullet3": "Opdater siden i studiet; samme handle.",
    "intent.for_small_businesses.kicker": "Små virksomheder",
    "intent.for_small_businesses.h1": "Offentlig side til åbningstid, menu og booking",
    "intent.for_small_businesses.lead":
      "Når kunder spørger om „linket”, giv én adresse med kort, Instagram, bestilling og kontakt — opdateret fra telefonen.",
    "intent.for_small_businesses.meta_title": "Link in bio til små virksomheder",
    "intent.for_small_businesses.meta_description":
      "Åbningstid, menu, kort og sociale på én Presh.Me-side.",
    "intent.for_small_businesses.bullet1": "Kort, tider, menu-PDF og bestilling samlet.",
    "intent.for_small_businesses.bullet2": "Instagram- og telefonknapper kunder bruger.",
    "intent.for_small_businesses.bullet3": "Redigér fra mobilen; kunder får altid det nyeste link.",
    "intent.for_small_businesses.nav": "Til små virksomheder",
    "intent.common.back_presh": "← Presh.Me",
    "intent.common.link_in_bio": "Link in bio",
  },
};

// For remaining langs: reuse DE catalog tone — load from hand file or fall back to EN in UI.
// es, de, fr, nl, no, sv, pl, fi, lt, et, it, ru: copy from da structure with language-specific file in repo later.
// Minimal: es + de + fr inline (abbreviated) — extend da pattern

const es = {
  ...Object.fromEntries(
    Object.entries(locales.da).map(([k, v]) => [k, v]),
  ),
};
// Replace es with real Spanish — write proper es block
Object.assign(es, {
  "intent.portfolio_website.h1": "Una web portfolio en un solo enlace",
  "intent.portfolio_website.lead":
    "Muestra trabajos elegidos, una bio breve y contacto — sin un sitio multipágina. Usa el enlace en email, Instagram o propuestas.",
  "intent.portfolio_website.meta_title": "Creador de web portfolio",
  "intent.portfolio_website.meta_description":
    "Crea un portfolio de una página en Presh.Me — trabajos, enlaces y contacto en una URL.",
  "intent.for_barbers.h1": "Reservas y redes en un solo enlace del local",
  "intent.for_barbers.lead":
    "Los clientes no deberían buscar la URL de reserva en las stories. Una página con reserva, precios, Instagram y ubicación.",
  "intent.for_barbers.meta_title": "Link in bio para barberos",
  "intent.common.link_in_bio": "Link in bio",
});

// Fill missing es keys from en for now
for (const key of Object.keys(en)) {
  if (!es[key]) es[key] = en[key];
}

locales.es = es;

// de, fr, nl, no, sv: use existing catalog fragments where possible
const de = { ...en };
Object.assign(de, {
  "intent.portfolio_website.h1": "Portfolio-Website in einem Link",
  "intent.portfolio_website.lead":
    "Zeige ausgewählte Arbeiten, eine kurze Bio und Kontakt — ohne große Website. Link in E-Mail, Instagram oder Angeboten.",
  "intent.for_barbers.h1": "Buchung und Socials in einem Shop-Link",
  "intent.for_barbers.lead":
    "Kunden sollen nicht in Stories nach der Buchungs-URL suchen. Eine Seite mit Buchung, Preisliste, Instagram und Standort.",
  "intent.common.back_presh": "← Presh.Me",
});
locales.de = de;

// Scandinavian: reuse Danish intent copy (better than English leftovers).
locales.no = { ...locales.da };
locales.sv = { ...locales.da };

const copyLangs = ["fr", "nl", "pl", "fi", "lt", "et", "it", "ru"];
for (const code of copyLangs) {
  locales[code] = { ...en, ...(locales[code] ?? {}) };
}

for (const [code, bundle] of Object.entries(locales)) {
  const missing = Object.keys(en).filter((k) => !(k in bundle));
  if (missing.length) {
    console.warn(`${code} missing ${missing.length} intent keys — filling EN`);
    for (const k of missing) bundle[k] = en[k];
  }
  fs.writeFileSync(path.join(outDir, `${code}.json`), `${JSON.stringify(bundle, null, 2)}\n`);
}

console.log("wrote locale intent files:", Object.keys(locales).join(", "));

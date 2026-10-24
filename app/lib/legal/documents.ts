export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  afterBullets?: string[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro?: string[];
  sections: LegalSection[];
};

const CONTACT = "hello@presh.me";

export const TERMS_DOCUMENT: LegalDocument = {
  title: "Lietošanas noteikumi",
  updatedAt: "2026-10-24",
  intro: [
    "Šie noteikumi regulē Presh (presh.me) lietošanu. Reģistrējoties vai turpinot lietot pakalpojumu, tu piekrīti šiem noteikumiem, Privātuma politikai un Sīkdatņu politikai.",
  ],
  sections: [
    {
      id: "content",
      title: "1. Saturs",
      paragraphs: [
        "Tu atbildi par visu materiālu, ko publicē savā Presh lapā. Publicējot saturu, tu piešķir Presh tiesības to izmantot, rādīt un izplatīt pakalpojuma ietvaros. Tu saglabā tiesības uz savu saturu, bet garantē, ka tas nepārkāpj likumu, intelektuālā īpašuma tiesības un nesatur ļaunprātīgu kodu.",
        "Presh var noņemt vai labot saturu pēc sava ieskata, arī ar automatizētām sistēmām, ja tas pārkāpj šos noteikumus vai politikas.",
      ],
    },
    {
      id: "prohibited",
      title: "2. Aizliegtais saturs",
      paragraphs: [
        "Nedrīksti izmantot Presh, lai publicētu, izplatītu vai saistītu ar:",
      ],
      bullets: [
        "krāpniecisku vai maldinošu saturu, tostarp phishing un shēmas;",
        "piramīdas, MLM verdzi vai augstas peļņas ieguldījumu solījumiem;",
        "saitēm uz ļaunprātīgiem vai aizdomīgiem ārējiem resursiem;",
        "nelikumīgām darbībām vai saturu, kas pārkāpj spēkā esošos likumus;",
        "naida runu, aizskaršanu vai saturu, kas apdraud citu drošību;",
        "spamu vai nevēlamu masveida ziņojumapmaiņu;",
        "saturs, kas seksualizē, izmanto vai apdraud nepilngadīgos, tostarp CSAM;",
        "seksuālo pakalpojumu reklāmām (arī tur, kur tās ir atļautas);",
        "intīmām bildēm vai video bez personas piekrišanas, tostarp AI ģenerētiem.",
      ],
      afterBullets: [
        "Presh var bez iepriekšēja brīdinājuma noņemt saturu un apturēt vai slēgt kontu. Pret nepilngadīgo seksuālu izmantošanu ir nulles tolerance: saturs tiek noņemts, konts slēgts, un gadījums var tikt ziņots kompetentajām iestādēm.",
      ],
    },
    {
      id: "adult",
      title: "3. Pieaugušo saturs",
      paragraphs: [
        "Pieaugušo satura veidotāji var lietot Presh šādās robežās:",
      ],
      bullets: [
        "jābūt vismaz 18 gadus vecam, lai publicētu vai saistītu pieaugušo saturu;",
        "drīksti saistīt uz pieaugušo saturu platformās, kas verificē vecumu (piem. OnlyFans);",
        "tavā Presh lapā nedrīkst rādīt kailumu vai seksuāli eksplicītus attēlus, video vai tekstu (profils, fons, bloki, embed);",
        "nedrīksti pārdot vai piegādāt pieaugušo saturu ārpus šīm platformām caur maksājumu lietotnēm vai failu saitēm.",
      ],
      afterBullets: [
        "Presh var pievienot vecuma brīdinājumu un izslēgt šādas lapas no reklāmas materiāliem.",
      ],
    },
    {
      id: "accounts",
      title: "4. Konti",
      paragraphs: [
        "Lai lietotu Presh, tev jābūt vismaz 13 gadus vecam (vai vecākam, ja tavā valstī to prasa likums). Ja esi jaunāks par 18, vajadzīga vecāka vai aizbildņa piekrišana. Pieaugušo saturam jābūt vismaz 18.",
        "Konta dati jāuztur precīzi. Tu atbildi par paroles drošību un darbībām savā kontā. Lietotājvārdi nedrīkst pārkāpt citu tiesības vai būt aizskaroši. Linku „rezervēšana” bez reālas lietošanas ir aizliegta.",
      ],
    },
    {
      id: "access",
      title: "5. Piekļuve un IP",
      paragraphs: [
        "Presh un tā dizains ir mūsu intelektuālais īpašums. Tu saņem ierobežotu, neekskluzīvu tiesību lietot platformu. Nedrīksti atdalīt grafiku no teksta vai kopēt pakalpojumu komerciāliem mērķiem bez atļaujas.",
      ],
    },
    {
      id: "third-party",
      title: "6. Trešo pušu saites",
      paragraphs: [
        "Lapā ievietotās ārējās saites ir ērtībai. Presh neatbild par trešo pušu saturu, privātumu vai praksi. Tu tās atver uz sava riska.",
      ],
    },
    {
      id: "termination",
      title: "7. Apturēšana un slēgšana",
      paragraphs: [
        "Presh var nekavējoties apturēt vai slēgt kontu bez brīdinājuma, tostarp par noteikumu pārkāpumiem. Lēmumi par apturēšanu ir galīgi pēc mūsu ieskata.",
      ],
    },
    {
      id: "indemnity",
      title: "8. Atlīdzināšana",
      paragraphs: [
        "Tu piekrīti atlīdzināt Presh zaudējumus, izmaksas un atbildību, kas rodas no tavas lietošanas vai noteikumu pārkāpuma.",
      ],
    },
    {
      id: "liability",
      title: "9. Atbildības ierobežojums",
      paragraphs: [
        "Presh nav atbildīgs par zaudējumiem, kas rodas no pakalpojuma lietošanas, cik to pieļauj likums. Atbildība ir ierobežota ar summu, ko esi samaksājis mums (ja tāda ir). Tu pats atbildi par datu drošību un dublējumiem.",
      ],
    },
    {
      id: "disclaimer",
      title: "10. Atruna",
      paragraphs: [
        "Pakalpojums tiek sniegts „kā ir”, bez jebkādām garantijām. Negarantējam nepārtrauktu darbību, kļūdu labošanu vai vīrusu neesamību.",
      ],
    },
    {
      id: "law",
      title: "11. Piemērojamais likums",
      paragraphs: [
        "Šos noteikumus regulē Latvijas Republikas likumi, ja vien obligāts patērētāju tiesību regulējums nenosaka citādi.",
      ],
    },
    {
      id: "changes",
      title: "12. Izmaiņas",
      paragraphs: [
        "Presh var mainīt noteikumus. Būtiskas izmaiņas paziņosim saprātīgā termiņā. Turpinot lietot pakalpojumu pēc izmaiņām, tu tām piekrīti.",
      ],
    },
    {
      id: "contact",
      title: "13. Kontakti",
      paragraphs: [
        `Jautājumiem par noteikumiem raksti uz ${CONTACT}. Lai ziņotu par pārkāpumu, norādi lapas linku un īsu aprakstu. Ja runa ir par bērna drošību vai intīmām bildēm bez piekrišanas, ieraksti to temata rindiņā. Tūlītēja bīstamība - sazinies ar vietējo policiju.`,
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Privātuma politika",
  updatedAt: "2026-10-24",
  intro: [
    "Presh rūpējas par tavu privātumu. Šī politika skaidro, kādus datus vācam, kāpēc un kādas ir tavas tiesības.",
    "Lietojot pakalpojumu, tu piekrīti šai politikai, Sīkdatņu politikai un Lietošanas noteikumiem.",
  ],
  sections: [
    {
      id: "collect",
      title: "1. Kādus datus vācam",
      paragraphs: [
        "Kontam: vārds, e-pasts, parole (saglabāta šifrētā vai hash formā, ne atklātā tekstā), izvēlētais links un lapas saturs, ko pats ievadi.",
        "Lietojot vietni, varam saņemt IP adresi, ierīces un pārlūka informāciju, kā arī datus caur sīkdatnēm (skat. Sīkdatņu politiku).",
        "Atbalsta pieprasījumos: e-pasts, ziņojuma saturs un ar to saistītā informācija.",
      ],
    },
    {
      id: "use",
      title: "2. Kāpēc lietojam datus",
      paragraphs: [
        "Lai nodrošinātu kontu un tavu publisko lapu, atjaunotu paroli, uzlabotu pakalpojumu, nodrošinātu drošību un atbildētu uz jautājumiem.",
        "Publiskajā lapā redzams tikai tas, ko pats publicē (vārds, bio, bildes, saites). E-pasts apmeklētājiem nav redzams.",
      ],
    },
    {
      id: "sharing",
      title: "3. Datu kopīgošana",
      paragraphs: [
        "Datus varam nodot pakalpojumu sniedzējiem (hostings, e-pasts, maksājumi, drošība, analitika), tikai cik nepieciešams un ar pienākumu aizsargāt datus.",
        "Varam atklāt informāciju, ja to prasa likums vai lai aizsargātu likumīgās intereses. Ārējo vietņu privātuma prakses šī politika nesedz.",
      ],
    },
    {
      id: "retention",
      title: "4. Glabāšana",
      paragraphs: [
        "Datus glabājam, kamēr konts ir aktīvs. Pēc slēgšanas daļu datu varam saglabāt likumisko pienākumu, strīdu un krāpšanas novēršanas dēļ.",
      ],
    },
    {
      id: "rights",
      title: "5. Tavas tiesības",
      paragraphs: [
        `ES / EEZ lietotājiem ir tiesības piekļūt, labot un dzēst personas datus. Raksti uz ${CONTACT}.`,
      ],
    },
    {
      id: "security",
      title: "6. Drošība",
      paragraphs: [
        "Ieviešam saprātīgus drošības pasākumus, taču absolūtu drošību internetā nevaram garantēt.",
      ],
    },
    {
      id: "changes",
      title: "7. Izmaiņas",
      paragraphs: [
        "Politikas izmaiņas stājas spēkā, publicējot atjaunināto versiju. Turpinot lietot Presh, tu piekrīti atjauninājumiem.",
      ],
    },
    {
      id: "contact",
      title: "8. Kontakti",
      paragraphs: [
        `Jautājumiem par datiem vai sūdzībām: ${CONTACT}.`,
      ],
    },
  ],
};

export const COOKIES_DOCUMENT: LegalDocument = {
  title: "Sīkdatņu politika",
  updatedAt: "2026-10-24",
  intro: [
    "Šī politika skaidro, kādas sīkdatnes un līdzīgas tehnoloģijas Presh var izmantot un kāpēc.",
  ],
  sections: [
    {
      id: "what",
      title: "1. Kas ir sīkdatnes",
      paragraphs: [
        "Sīkdatnes ir mazi teksta faili, ko vietne saglabā tavā ierīcē. Pārlūks tās izmanto, lai atpazītu ierīci un atcerētos izvēles nākamajās vizītēs.",
      ],
    },
    {
      id: "types",
      title: "2. Kādas sīkdatnes lietojam",
      paragraphs: [
        "Obligātās - nepieciešamas vietnes darbībai un tavas sīkdatņu piekrišanas saglabāšanai. Bez tām sistēma nedarbojas korekti.",
        "Preferenču - atceras tavas izvēles saskarnē (ja tādas tiek ieviestas).",
        "Statistikas - palīdz saprast, kā vietne tiek lietota (piem. anonīma analitika), tikai ar tavu piekrišanu.",
        "Mārketinga - personalizētai komunikācijai; šobrīd Presh tās aktīvi neizmanto, bet kategorija ir sagatavota, ja nākotnē tās pievienosim.",
      ],
    },
    {
      id: "third",
      title: "3. Trešo pušu sīkdatnes",
      paragraphs: [
        "Ja ieslēdzam trešo pušu rīkus (piem. analitiku), to sīkdatnes kontrolē attiecīgais sniedzējs saskaņā ar savu politiku.",
      ],
    },
    {
      id: "manage",
      title: "4. Kā pārvaldīt",
      paragraphs: [
        "Piekrišanu vari mainīt jebkurā laikā sīkdatņu iestatījumos (poga šajā lapā vai banerī). Vari arī dzēst sīkdatnes pārlūka iestatījumos; daļa funkciju tad var nestrādāt.",
      ],
    },
    {
      id: "changes",
      title: "5. Izmaiņas",
      paragraphs: [
        "Politiku varam atjaunināt. Turpinot lietot vietni, tu piekrīti aktuālajai versijai.",
      ],
    },
    {
      id: "contact",
      title: "6. Kontakti",
      paragraphs: [
        `Jautājumiem: ${CONTACT}.`,
      ],
    },
  ],
};

export function formatLegalDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export type LegalDocKind = "terms" | "privacy" | "cookies";

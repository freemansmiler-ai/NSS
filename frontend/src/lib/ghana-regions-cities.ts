export interface GhanaRegion {
  name: string;
  code: string;
  cities: string[];
}

export const GHANA_REGIONS: GhanaRegion[] = [
  {
    name: "Greater Accra Region",
    code: "GAR",
    cities: [
      "East Legon",
      "Madina",
      "Spintex",
      "Osu",
      "Tema",
      "Dansoman",
      "Dome",
      "Adenta",
      "Achimota",
      "Kaneshie",
      "Lapaz",
      "Tesano",
      "Ashaiman",
      "Cantonments",
      "Dzorwulu",
      "Roman Ridge",
      "Weija",
      "Prampram",
      "Dawhenya",
      "Kasoa Border",
      "Ablekuma",
      "Accra Central",
      "Legon UG Campus Area"
    ]
  },
  {
    name: "Ashanti Region",
    code: "ASH",
    cities: [
      "Kumasi - KNUST Campus Area",
      "Kumasi - Ayigya",
      "Kumasi - Adum",
      "Kumasi - Bantama",
      "Kumasi - Asokwa",
      "Kumasi - Suame",
      "Kumasi - Ahodwo",
      "Kumasi - Santasi",
      "Kumasi - Tafo",
      "Kumasi - Tanoso",
      "Obuasi",
      "Ejisu",
      "Mampong",
      "Konongo",
      "Bekwai",
      "Offinso"
    ]
  },
  {
    name: "Western Region",
    code: "WR",
    cities: [
      "Takoradi - Market Circle",
      "Takoradi - Fijai",
      "Takoradi - Anaji",
      "Takoradi - Kojokrom",
      "Sekondi",
      "Tarkwa",
      "Axim",
      "Elubo",
      "Prestea",
      "Bogoso"
    ]
  },
  {
    name: "Central Region",
    code: "CR",
    cities: [
      "Cape Coast - UCC Campus Area",
      "Cape Coast - Abura",
      "Cape Coast - Pedu",
      "Winneba",
      "Mankessim",
      "Elmina",
      "Kasoa",
      "Saltpond",
      "Agona Swedru"
    ]
  },
  {
    name: "Eastern Region",
    code: "ER",
    cities: [
      "Koforidua",
      "Nkawkaw",
      "Nsawam",
      "Akosombo",
      "Suhum",
      "Asamankese",
      "Kibi",
      "Aburi",
      "Mampong-Akwapim"
    ]
  },
  {
    name: "Volta Region",
    code: "VR",
    cities: [
      "Ho",
      "Hohoe",
      "Kpando",
      "Aflao",
      "Sogakope",
      "Anloga",
      "Dzodze",
      "Denu",
      "Keta"
    ]
  },
  {
    name: "Northern Region",
    code: "NR",
    cities: [
      "Tamale - UDS Campus Area",
      "Tamale - Aboabo",
      "Tamale - Lamashegu",
      "Tamale - Nyankpala",
      "Tamale - Kalpohin",
      "Savelugu",
      "Yendi"
    ]
  },
  {
    name: "Upper East Region",
    code: "UER",
    cities: [
      "Bolgatanga",
      "Navrongo",
      "Bawku",
      "Paga"
    ]
  },
  {
    name: "Upper West Region",
    code: "UWR",
    cities: [
      "Wa - UDS Campus Area",
      "Jirapa",
      "Lawra",
      "Tumu"
    ]
  },
  {
    name: "Bono Region",
    code: "BR",
    cities: [
      "Sunyani",
      "Berekum",
      "Dormaa Ahenkro",
      "Wenchi"
    ]
  },
  {
    name: "Bono East Region",
    code: "BER",
    cities: [
      "Techiman",
      "Kintampo",
      "Nkoranza",
      "Atebubu"
    ]
  },
  {
    name: "Ahafo Region",
    code: "AHR",
    cities: [
      "Goaso",
      "Mim",
      "Duayaw Nkwanta",
      "Kenyasi"
    ]
  },
  {
    name: "Oti Region",
    code: "OR",
    cities: [
      "Dambai",
      "Jasikan",
      "Nkwanta",
      "Kadjebi"
    ]
  },
  {
    name: "Savannah Region",
    code: "SR",
    cities: [
      "Damongo",
      "Bole",
      "Salaga",
      "Buipe"
    ]
  },
  {
    name: "North East Region",
    code: "NER",
    cities: [
      "Nalerigu",
      "Gambaga",
      "Walewale"
    ]
  },
  {
    name: "Western North Region",
    code: "WNR",
    cities: [
      "Sefwi Wiawso",
      "Bibiani",
      "Enchi"
    ]
  }
];

export const ALL_GHANA_CITIES: string[] = Array.from(
  new Set(GHANA_REGIONS.flatMap((r) => r.cities))
).sort();

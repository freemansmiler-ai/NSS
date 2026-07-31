export interface UserData {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  isEmailVerified?: boolean;
  isVerified?: boolean;
  isUnlocked?: boolean;
}

export interface PropertyData {
  id: string;
  landlordId: string;
  landlord?: UserData;
  title: string;
  propertyType: "SINGLE_ROOM" | "CHAMBER_AND_HALL";
  facilityType: "SELF_CONTAIN" | "SHARED_FACILITIES";
  pricePerMonth: number;
  minLeasePeriod: "TEN_MONTHS" | "ONE_YEAR" | "TWO_YEARS_PLUS";
  generalArea: string;
  exactGhanaPostGps: string;
  exactStreetAddress: string;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
  images: string[];
  contactPhone: string;
  contactWhatsapp: string;
  isActive: boolean;
  isNewlyListed?: boolean;
  viewsCount?: number;
  daysRemaining?: number;
  daysUntilDeletion?: number;
  isExpired?: boolean;
  paymentRef?: string | null;
  lastRenewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_LANDLORDS: UserData[] = [
  {
    id: "landlord-1",
    email: "kwame.mensah@nssdirectstay.gh",
    fullName: "Chief Kwame Mensah",
    phoneNumber: "+233 24 412 3456",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-2",
    email: "abena.owusu@nssdirectstay.gh",
    fullName: "Mad. Abena Owusu",
    phoneNumber: "+233 20 890 1234",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-3",
    email: "kofi.appiah@nssdirectstay.gh",
    fullName: "Mr. Kofi Appiah",
    phoneNumber: "+233 27 555 6789",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-4",
    email: "grace.tagoe@nssdirectstay.gh",
    fullName: "Auntie Grace Tagoe",
    phoneNumber: "+233 24 333 9988",
    role: "LANDLORD",
    isVerified: true
  }
];

export const INITIAL_PROPERTIES: PropertyData[] = [
  {
    id: "prop-1",
    landlordId: "landlord-1",
    landlord: INITIAL_LANDLORDS[0],
    title: "Clean Self-Contain Single Room near UG Legon Campus",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 380.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Madina - Social Center Area",
    exactGhanaPostGps: "GM-042-8910",
    exactStreetAddress: "Plot 14, Blueberry Street, Madina Social Center",
    latitude: 5.6695,
    longitude: -0.1668,
    description: "Ideal room for NSS personnel posted to UG Legon, Madina Market or Accra North. Features a private bathroom, dedicated ECG prepaid meter, separate kitchen unit, constant Polytank water flow, and high security perimeter fence.",
    amenities: [
      "ECG Prepaid Meter",
      "Private Bathroom",
      "Polytank Water Supply",
      "Personal Kitchenette",
      "Fenced Gate & Security Lighting",
      "Tiled Floor"
    ],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233244123456",
    contactWhatsapp: "233244123456",
    isActive: true,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z"
  },
  {
    id: "prop-2",
    landlordId: "landlord-2",
    landlord: INITIAL_LANDLORDS[1],
    title: "Spacious Chamber & Hall Self-Contain Apartment",
    propertyType: "CHAMBER_AND_HALL",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 650.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "East Legon Extension - Ogbojo",
    exactGhanaPostGps: "GE-230-4491",
    exactStreetAddress: "House No. 42, Fire Armor Street, Ogbojo",
    latitude: 5.6560,
    longitude: -0.1420,
    description: "Newly painted Chamber & Hall self-contain apartment with wide living area, spacious bedroom, fully tiled washroom, balcony view, and ample parking space. Easy 15-minute trotro connection to Legon, Shiashie, and Airport Residential Area.",
    amenities: [
      "ECG Prepaid Meter",
      "Own Balcony",
      "Polytank Water Tank",
      "Compound Car Parking",
      "Pop Ceiling",
      "Fenced Gate"
    ],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233208901234",
    contactWhatsapp: "233208901234",
    isActive: true,
    createdAt: "2026-07-05T14:30:00Z",
    updatedAt: "2026-07-05T14:30:00Z"
  },
  {
    id: "prop-3",
    landlordId: "landlord-3",
    landlord: INITIAL_LANDLORDS[2],
    title: "Affordable Single Room (Shared Facilities)",
    propertyType: "SINGLE_ROOM",
    facilityType: "SHARED_FACILITIES",
    pricePerMonth: 220.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Dome - Pillar 2 Area",
    exactGhanaPostGps: "GE-088-1209",
    exactStreetAddress: "Compound House 12, Off Pillar 2 Main Road, Dome",
    latitude: 5.6420,
    longitude: -0.2280,
    description: "Budget-friendly single room in a peaceful, serene compound. Clean shared washroom (cleaned daily), shared ECG meter with sub-metering, overhead water tank, and close proximity to Achimota train station & Trotro station.",
    amenities: [
      "Shared ECG Meter",
      "Overhead Water Tank",
      "Quiet Compound",
      "Tiled Floor",
      "Burglar Proofing"
    ],
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233275556789",
    contactWhatsapp: "233275556789",
    isActive: true,
    createdAt: "2026-07-10T09:15:00Z",
    updatedAt: "2026-07-10T09:15:00Z"
  },
  {
    id: "prop-4",
    landlordId: "landlord-4",
    landlord: INITIAL_LANDLORDS[3],
    title: "Modern Self-Contain Chamber & Hall near Spintex Coastal",
    propertyType: "CHAMBER_AND_HALL",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 750.00,
    minLeasePeriod: "ONE_YEAR",
    generalArea: "Spintex Road - Coastal Junction",
    exactGhanaPostGps: "GT-104-5520",
    exactStreetAddress: "Coastal Estates Lane 3, Spintex",
    latitude: 5.6230,
    longitude: -0.1030,
    description: "Premium NSS rental unit along Spintex Road. Modern kitchen, glass shower booth, dedicated water pump system, fully tiled ground floor, individual ECG meter. Perfect for NSS personnel working around Spintex Industrial Area or Tetteh Quarshie.",
    amenities: [
      "ECG Prepaid Meter",
      "Private Water Pump",
      "Standby Generator",
      "Fenced Gate",
      "Tiled Floor",
      "Gated Compound"
    ],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233243339988",
    contactWhatsapp: "233243339988",
    isActive: true,
    createdAt: "2026-07-12T16:45:00Z",
    updatedAt: "2026-07-12T16:45:00Z"
  },
  {
    id: "prop-5",
    landlordId: "landlord-1",
    landlord: INITIAL_LANDLORDS[0],
    title: "Self-Contain Single Room near KNUST Tech Junction (Kumasi)",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 320.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Ayigya - Tech Junction",
    exactGhanaPostGps: "AK-412-9011",
    exactStreetAddress: "Ayigya Zongo Street, Kumasi",
    latitude: 6.6780,
    longitude: -1.5690,
    description: "Clean self-contain single room within walking distance to KNUST Campus and Tech Junction. Features private toilet/bath, running water, and personal ECG meter.",
    amenities: [
      "Private Bathroom",
      "ECG Prepaid Meter",
      "Walking distance to Tech Junction",
      "Polytank Water Supply"
    ],
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233244123456",
    contactWhatsapp: "233244123456",
    isActive: true,
    createdAt: "2026-07-14T11:00:00Z",
    updatedAt: "2026-07-14T11:00:00Z"
  },
  {
    id: "prop-6",
    landlordId: "landlord-2",
    landlord: INITIAL_LANDLORDS[1],
    title: "Executive Single Room Self-Contain in Osu RE",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 550.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Osu - RE Area",
    exactGhanaPostGps: "GA-035-7712",
    exactStreetAddress: "Oxford Street Lane 4, Osu",
    latitude: 5.5580,
    longitude: -0.1810,
    description: "Convenient single room self contain close to Accra Central, Ministries, and Osu Oxford Street. Ideal for NSP personnel posted to government ministries or corporate firms in Accra CBD.",
    amenities: [
      "Private Bathroom",
      "AC Ready",
      "ECG Prepaid Meter",
      "Fenced Gate",
      "Polytank"
    ],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80"
    ],
    contactPhone: "+233208901234",
    contactWhatsapp: "233208901234",
    isActive: true,
    createdAt: "2026-07-15T08:20:00Z",
    updatedAt: "2026-07-15T08:20:00Z"
  }
];

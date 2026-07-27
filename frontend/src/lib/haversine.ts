export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WorkplaceHotspot {
  id: string;
  name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
}

export const POPULAR_NSP_WORKPLACES: WorkplaceHotspot[] = [
  {
    id: "legon-ug",
    name: "University of Ghana, Legon",
    region: "Greater Accra",
    city: "Accra",
    latitude: 5.6506,
    longitude: -0.1870,
    description: "Main Campus, Balme Library, Legon Hospital"
  },
  {
    id: "accra-ministries",
    name: "Accra Central & Ministries District",
    region: "Greater Accra",
    city: "Accra Central",
    latitude: 5.5500,
    longitude: -0.2000,
    description: "High Street, Ghana Revenue Authority, Ministries Area"
  },
  {
    id: "airport-residential",
    name: "Airport Residential & City Galleria",
    region: "Greater Accra",
    city: "Accra",
    latitude: 5.6022,
    longitude: -0.1772,
    description: "Airport City, Marina Mall, Corporate HQ Hub"
  },
  {
    id: "spintex-industrial",
    name: "Spintex Road Commercial Zone",
    region: "Greater Accra",
    city: "Spintex",
    latitude: 5.6200,
    longitude: -0.1000,
    description: "Coca-Cola Roundabout, Coastal, Texpo Area"
  },
  {
    id: "madina-zongo-junction",
    name: "Madina Zongo Junction & Market Hub",
    region: "Greater Accra",
    city: "Madina",
    latitude: 5.6680,
    longitude: -0.1650,
    description: "Madina Main Market, Firestone, Social Center"
  },
  {
    id: "knust-kumasi",
    name: "KNUST Campus & Tech Junction",
    region: "Ashanti",
    city: "Kumasi",
    latitude: 6.6745,
    longitude: -1.5716,
    description: "KNUST Administration, Ayigya, Maxima"
  },
  {
    id: "kumasi-central",
    name: "Kumasi Central Business District",
    region: "Ashanti",
    city: "Kumasi",
    latitude: 6.6900,
    longitude: -1.6200,
    description: "Kejetia Market, Adum, Ridge Kumasi"
  },
  {
    id: "ucc-cape-coast",
    name: "University of Cape Coast (UCC)",
    region: "Central",
    city: "Cape Coast",
    latitude: 5.1054,
    longitude: -1.2858,
    description: "Old Site & New Site, UCC Hospital"
  },
  {
    id: "takoradi-market-circle",
    name: "Takoradi Market Circle",
    region: "Western",
    city: "Takoradi",
    latitude: 4.8872,
    longitude: -1.7589,
    description: "Takoradi Harbour, Port Area, Central Business Zone"
  },
  {
    id: "tamale-teaching-hospital",
    name: "Tamale Teaching Hospital / Central",
    region: "Northern",
    city: "Tamale",
    latitude: 9.4008,
    longitude: -0.8393,
    description: "TTH Area, Tamale Central Market, Bolga Road"
  }
];

/**
 * Calculates the great-circle distance between two points on the Earth
 * using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const EARTH_RADIUS_KM = 6371.0088;

  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface CommuteAnalysis {
  straightLineKm: number;
  estRoadKm: number;
  estTrotroMinutes: number;
  estWalkingMinutes: number;
  badgeColor: string;
  badgeLabel: string;
}

/**
 * Calculates commute time and road distance estimates tailored for Ghanaian urban transport context.
 */
export function analyzeCommute(
  workplaceCoord: Coordinates,
  propertyCoord: Coordinates
): CommuteAnalysis {
  const straightLineKm = calculateHaversineDistance(workplaceCoord, propertyCoord);
  // Urban road multiplier (~1.3x straight line in Ghana cities due to road grids & roundabouts)
  const estRoadKm = straightLineKm * 1.3;
  
  // Trotro / Bolt / Taxi speed in Ghanaian city traffic (~18-22 km/h avg including stops)
  const estTrotroMinutes = Math.max(3, Math.round((estRoadKm / 20) * 60));
  
  // Walking speed (~4.5 km/h)
  const estWalkingMinutes = Math.round((estRoadKm / 4.5) * 60);

  let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  let badgeLabel = "Walking Distance";

  if (estRoadKm > 1.5 && estRoadKm <= 5) {
    badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
    badgeLabel = "Quick Trotro Ride";
  } else if (estRoadKm > 5 && estRoadKm <= 10) {
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    badgeLabel = "Moderate Commute";
  } else if (estRoadKm > 10) {
    badgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
    badgeLabel = "Longer Commute";
  }

  return {
    straightLineKm: Number(straightLineKm.toFixed(2)),
    estRoadKm: Number(estRoadKm.toFixed(2)),
    estTrotroMinutes,
    estWalkingMinutes,
    badgeColor,
    badgeLabel,
  };
}

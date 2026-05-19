export interface GeocodedLocation {
  country: string;
  city: string;
  country_code: string; // ISO 3166-1 alpha-2; future-proof, not stored in Slice 3
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")               // separate accents from base letters
    .replace(/\p{M}/gu, "")         // strip combining accent marks
    .toLowerCase()
    .replace(/['’]/g, "")                // remove straight + curly apostrophes
    .replace(/[^a-z0-9]+/g, "-")             // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "");                // trim leading/trailing hyphens
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(
      `https://nominatim.openstreetmap.org/reverse` +
        `?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10` +
        `&email=stevecurrie2000@gmail.com`,
      { signal: controller.signal }
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

  const data = await res.json() as {
    address?: {
      country?: string;
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      country_code?: string;
    };
  };

  const addr = data.address;
  if (!addr) throw new Error("No address in Nominatim response");

  const country = addr.country;
  if (!country) throw new Error("No country in Nominatim response");

  const city = addr.city ?? addr.town ?? addr.village ?? addr.suburb;
  if (!city) throw new Error("No city-level place in Nominatim response");

  return {
    country,
    city,
    country_code: (addr.country_code ?? "").toUpperCase(),
  };
}

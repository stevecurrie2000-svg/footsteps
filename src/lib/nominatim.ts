export type GeocodeResult =
  | {
      status: 'ok';
      countryName: string;
      countryCode: string;
      citySlug: string;
      cityName: string;
    }
  | {
      status: 'partial';
      countryName: string;
      countryCode: string;
    }
  | {
      status: 'error';
      reason: 'timeout' | 'network' | 'no_country';
    };

export function slugify(name: string): string {
  return name
    .normalize("NFD")               // separate accents from base letters
    .replace(/\p{M}/gu, "")         // strip combining accent marks
    .toLowerCase()
    .replace(/['']/g, "")                // remove straight + curly apostrophes
    .replace(/[^a-z0-9]+/g, "-")             // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "");                // trim leading/trailing hyphens
}

export type ForwardGeocodeResult =
  | { status: 'ok'; latitude: number; longitude: number; displayName: string }
  | { status: 'not_found' }
  | { status: 'error'; reason: 'timeout' | 'network' | 'parse' };

/**
 * Forward geocode a city name to coordinates.
 * Uses Nominatim's structured query (NOT q=).
 * countryName is optional context to narrow disambiguation.
 */
export async function forwardGeocode(
  cityName: string,
  countryName?: string,
): Promise<ForwardGeocodeResult> {
  if (!cityName || !cityName.trim()) return { status: 'not_found' };

  const params = new URLSearchParams({
    city: cityName.trim(),
    format: 'jsonv2',
    limit: '1',
  });
  if (countryName && countryName.trim()) {
    params.set('country', countryName.trim());
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'footsteps.gallery (stevecurrie2000@gmail.com)' },
      }
    );
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    return {
      status: 'error',
      reason: (err as Error).name === 'AbortError' ? 'timeout' : 'network',
    };
  }

  if (!res.ok) return { status: 'error', reason: 'network' };

  let data: Array<{ lat: string; lon: string; display_name: string }>;
  try {
    data = await res.json() as typeof data;
  } catch {
    return { status: 'error', reason: 'parse' };
  }

  if (!Array.isArray(data) || data.length === 0) return { status: 'not_found' };

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { status: 'error', reason: 'parse' };
  }

  return { status: 'ok', latitude: lat, longitude: lon, displayName: data[0].display_name ?? '' };
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
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
    clearTimeout(timer);
  } catch {
    clearTimeout(timer);
    return controller.signal.aborted
      ? { status: 'error', reason: 'timeout' }
      : { status: 'error', reason: 'network' };
  }

  if (!res.ok) return { status: 'error', reason: 'network' };

  const data = await res.json() as {
    address?: {
      country?: string;
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      hamlet?: string;
      municipality?: string;
      county?: string;
      borough?: string;
      country_code?: string;
    };
  };

  const addr = data.address;
  if (!addr?.country) return { status: 'error', reason: 'no_country' };

  const country = addr.country;
  const countryCode = (addr.country_code ?? "").toUpperCase();

  const cityName =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.suburb ??
    addr.hamlet ??
    addr.municipality ??
    addr.county ??
    addr.borough ??
    null;

  if (!cityName) {
    return { status: 'partial', countryName: country, countryCode };
  }

  // When city is present, prefer suburb if it differs (e.g. Marrickville vs Sydney)
  const resolvedCityName =
    addr.city && addr.suburb && addr.suburb.toLowerCase() !== addr.city.toLowerCase()
      ? addr.suburb
      : cityName;

  return {
    status: 'ok',
    countryName: country,
    countryCode,
    cityName: resolvedCityName,
    citySlug: slugify(resolvedCityName),
  };
}

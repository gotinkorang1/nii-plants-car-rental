const OSM_ORIGIN = "https://www.openstreetmap.org";

function assertCoordinates(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("OpenStreetMap coordinates must be valid latitude and longitude.");
  }
}

/** Browseable map with a marker. Nominatim/OSM, not Google. */
export function osmBrowseUrl(
  latitude: number,
  longitude: number,
  zoom = 16,
): string {
  assertCoordinates(latitude, longitude);
  return `${OSM_ORIGIN}/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
}

/** Official OSM embed iframe source for a marker. */
export function osmEmbedUrl(
  latitude: number,
  longitude: number,
  span = 0.012,
): string {
  assertCoordinates(latitude, longitude);
  const minLon = longitude - span;
  const minLat = latitude - span;
  const maxLon = longitude + span;
  const maxLat = latitude + span;
  return `${OSM_ORIGIN}/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${latitude},${longitude}`;
}

export function osmCopyrightUrl() {
  return `${OSM_ORIGIN}/copyright`;
}

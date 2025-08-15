import * as geofire from 'geofire-common';

export function geohashFor(lat, lng) {
  return geofire.geohashForLocation([lat, lng]);
}

// Returns {start,end} bounds for querying by a radius in meters
export function geobounds(lat, lng, radiusInM) {
  return geofire.geohashQueryBounds([lat, lng], radiusInM);
}

export function distanceM(aLat, aLng, bLat, bLng) {
  return geofire.distanceBetween([aLat, aLng], [bLat, bLng]) * 1000;
}

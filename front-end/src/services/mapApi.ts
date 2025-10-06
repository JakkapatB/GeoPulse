import axios from "axios";

// Basic GeoJSON-based typings for map features (hotspots)
// Exported so other modules (e.g. pages/MapMonitor) can consume without using `any`.
export interface MapFeatureProperties {
  acq_date?: string; // acquisition date (ISO or YYYY-MM-DD)
  frp?: number; // fire radiative power
  // Allow additional dynamic properties from API without losing type-safety for known fields
  [key: string]: unknown;
}

export type MapFeature = GeoJSON.Feature<GeoJSON.Point, MapFeatureProperties>;
export type MapFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MapFeatureProperties
>;

const API_KEY =
  "7YS8I82KbtLtZZejpWqMzeeIdtKahrUEMPhHW1PuX5DlhY6qjaZaFQOHi15RpH48";
const BASE_URL = "https://app.vallarismaps.com/core/api/features/1.1";

export const getMapFeatures = async (
  collectionId: string
): Promise<MapFeatureCollection> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/collections/${collectionId}/items`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );
    // Cast the response to our typed FeatureCollection. If the API contract changes,
    // downstream code will still compile but runtime validation could be added later.
    return response.data as MapFeatureCollection;
  } catch (error) {
    console.error("Error fetching map features:", error);
    throw error;
  }
};

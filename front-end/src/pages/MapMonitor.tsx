import { useEffect, useState } from "react";
import { getMapFeatures, type MapFeatureCollection } from "../services/mapApi";
import MapView from "../components/Mapview";

const MapMonitor = () => {
  const [data, setData] = useState<MapFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMapFeatures("68db604f6d325faa74ba5bbd");
        setData(result);
        setError(null);
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <MapView
        data={data as MapFeatureCollection}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MapMonitor;

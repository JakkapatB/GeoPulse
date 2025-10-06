import React, { createContext, useContext, useState, useCallback } from "react";

export interface UserLocationState {
  coords: { lng: number; lat: number } | null;
  placeName: string | null;
  updating: boolean;
}

interface UserLocationContextValue extends UserLocationState {
  setCoords: (lng: number, lat: number) => void;
  setPlaceName: (name: string | null) => void;
  setUpdating: (updating: boolean) => void;
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(
  undefined
);

export const UserLocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [coords, setCoordsState] = useState<UserLocationState["coords"]>(null);
  const [placeName, setPlaceNameState] = useState<string | null>(null);
  const [updating, setUpdatingState] = useState(false);

  const setCoords = useCallback((lng: number, lat: number) => {
    setCoordsState({ lng, lat });
  }, []);
  const setPlaceName = useCallback(
    (name: string | null) => setPlaceNameState(name),
    []
  );
  const setUpdating = useCallback((u: boolean) => setUpdatingState(u), []);

  return (
    <UserLocationContext.Provider
      value={{
        coords,
        placeName,
        updating,
        setCoords,
        setPlaceName,
        setUpdating,
      }}
    >
      {children}
    </UserLocationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserLocation = () => {
  const ctx = useContext(UserLocationContext);
  if (!ctx)
    throw new Error("useUserLocation must be used within UserLocationProvider");
  return ctx;
};

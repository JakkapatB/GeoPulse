import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Index from "../pages/Index";
import MainLayout from "../layouts/MainLayout";
import MapMonitor from "../pages/MapMonitor";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/map-monitor" element={<MainLayout />}>
        <Route index element={<MapMonitor />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

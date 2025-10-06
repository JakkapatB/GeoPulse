import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <header>
        <Navbar />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

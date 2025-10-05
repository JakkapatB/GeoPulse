import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

import { Outlet } from "@remix-run/react";
import Navbar from "#app/components/navbar.tsx";

export default function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col justify-between">
        <header className="container">
          <Navbar />
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}

import { Outlet } from "@remix-run/react";
import Header from "#app/components/header.tsx";

export default function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col justify-between">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}

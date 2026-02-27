import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen africa-gradient continent-bg">
      <AppSidebar />
      <main className="ml-[240px] min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

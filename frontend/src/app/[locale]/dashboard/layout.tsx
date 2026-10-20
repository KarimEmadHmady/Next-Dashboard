'use client';
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  let locale: string = typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : "en";

  // Sidebar open state for mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <main className={`flex-1 bg-gray-50 ${locale === 'ar' ? 'sm:mr-64' : 'sm:ml-64'} ${locale === 'ar' ? 'pr-20 sm:pr-0' : 'pl-20 sm:pl-0'}`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 
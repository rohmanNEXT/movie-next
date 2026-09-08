"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex relative">
      <div className="fixed left-0 top-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col">
        <main className="flex-1 w-full px-6 md:px-16 lg:px-20 pt-24 md:pt-28 lg:pt-16 pb-32">
          {children}
        </main>
      </div>
    </div>
  );
}

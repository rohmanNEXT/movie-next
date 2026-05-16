"use client"

import React from 'react';
import Sidebar from '@/components/Sidebar';
import withAdmin from '@/hoc/withAdmin';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex">
      <Sidebar />
      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col">
        {/* Empty page content */}
        <main className="flex-1 w-full px-6 md:px-16 lg:px-20 pt-24 md:pt-28 lg:pt-16 pb-32">
          <div className="text-gray-500 text-center mt-20">
            Coba interaksi di menu sebelah kiri
          </div>
        </main>
      </div>
    </div>
  );
};

export default withAdmin(DashboardPage);

"use client";

import React from "react";
import withAdmin from "@/hoc/withAdmin";

const DashboardPage: React.FC = () => {
  return (
    <div className="text-gray-500 text-center mt-20">
      Coba interaksi di menu sebelah kiri
    </div>
  );
};

export default withAdmin(DashboardPage);
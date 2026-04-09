import React from "react";
import Dashboard from "../admincomponents/Dashboard";
// Import your admin products component
const AdminPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Dashboard />
      </main>
    </div>
  );
};

export default AdminPage;

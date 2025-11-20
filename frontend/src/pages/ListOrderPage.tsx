import React from "react";
import ListOrder from "../components/ListOrder";
const ListOrderPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <ListOrder />
      </main>
    </div>
  );
};
export default ListOrderPage;

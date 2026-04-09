import React from "react";
import CreateOrder from "../components/CreateOrder";

const OrderPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <CreateOrder />
      </main>
    </div>
  );
};
export default OrderPage;

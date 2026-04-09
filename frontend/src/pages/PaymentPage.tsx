import React from "react";
import PaymentResult from "../components/PaymentResult";

const PaymentPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <PaymentResult />
      </main>
    </div>
  );
};
export default PaymentPage;

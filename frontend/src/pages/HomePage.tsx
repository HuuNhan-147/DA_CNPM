// pages/HomePage.tsx
import React from "react";
import Banner from "../components/Banner";
import FeaturedProducts from "../components/FeaturedProducts";
import Footer from "../components/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Banner />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

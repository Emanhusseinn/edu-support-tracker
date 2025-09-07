import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import Privacy from "./Privacy";
import Contact from "./Contact";
import Footer from "./Footer";
import "../../styles/landing.scss"
const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Privacy />
      <Contact />
      <Footer />
    </>
  );
};

export default LandingPage;

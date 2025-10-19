import React from "react";
import logo from "../../assets/logo.png"; // استعملي الشعار اللي سويناه

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="overlay">
        <img src={logo} alt="بنك الأهداف" className="hero-logo" />
        <h1 className="hero-title">بنك الأهداف</h1>
        <p className="hero-subtitle">
منصة تعليمية متخصصة لدعم الطلبة ذوي الاحتياجات الخاصة، حيث تساعد المعلمين على إعداد الخطط التربوية الفردية، متابعة مستوى الطلبة وتطورهم، وتقديم خطط علاجية، إثرائية وسلوكية في بيئة تعليمية دامجة ومبتكرة تواكب التحول الرقمي وتقنيات الذكاء الاصطناعي
        </p>
        <a href="#about" className="hero-btn">اكتشف المزيد</a>
      </div>
    </section>
  );
};

export default Hero;

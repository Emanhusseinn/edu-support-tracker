import React from "react";
import logo from "../../assets/logo.png"; // ضيفي شعارك بمسار assets

const Footer = () => {
  return (
    <footer style={{ backgroundColor: "#121212", color: "#f1c40f", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        
        {/* Logo */}
        <img src={logo} alt="بنك الأهداف" style={{ height: "60px", marginBottom: "1rem" , borderRadius: "20px", border: "6px solid #2e1436"}} />

        {/* Links */}
        <nav style={{ marginBottom: "1rem" }}>
          <ul style={{ display: "flex", justifyContent: "center", gap: "2rem", listStyle: "none", padding: 0 }}>
            <li><a href="#about" style={{ color: "#8e44ad", textDecoration: "none" }}>ماذا نقدم</a></li>
            <li><a href="#vision" style={{ color: "#8e44ad", textDecoration: "none" }}>رؤيتنا</a></li>
            <li><a href="#services" style={{ color: "#8e44ad", textDecoration: "none" }}>الخدمات</a></li>
            <li><a href="#contact" style={{ color: "#8e44ad", textDecoration: "none" }}>اتصل بنا</a></li>
          </ul>
        </nav>

        {/* Rights */}
        <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
          © {new Date().getFullYear()} بنك الأهداف | جميع الحقوق محفوظة
        </p>
        <p style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "0.5rem" }}>
          تصميم وتنفيذ وإعداد: <span style={{ color: "#f1c40f" }}>الأستاذة فدوى الزغل</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

import React from "react";
import logo from "../../assets/logo.png"; // استعملي الشعار اللي عملتلك اياه

const Navbar = () => {
  const linkStyle = {
    backgroundColor: "transparent",
    padding: "0.5rem 1rem",
    borderRadius: "25px",
    border: "1px solid #f1c40f",
    color: "#f1c40f",
    textDecoration: "none",
    transition: "all 0.3s ease",
  };

  const linkHover = {
    backgroundColor: "#f1c40f",
    color: "#121212",
  };

  return (
    <nav style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "92%",
      backgroundColor: "transparent",
      padding: "1rem 2rem",
      zIndex: 10,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* الشعار */}
        <img src={logo} alt="بنك الأهداف" style={{ height: "50px",  borderRadius: "20px", border: "6px solid #2e1436" }} />

        {/* التابات */}
        <ul style={{
          display: "flex",
          gap: "1rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}>
          {[
            { label: "ماذا نقدم", href: "#about" },
            { label: "رؤيتنا", href: "#vision" },
            { label: "الخدمات", href: "#services" },
            { label: "اتصل بنا", href: "#contact" },
          ].map((tab, idx) => (
            <li key={idx}>
              <a
                href={tab.href}
                style={linkStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, linkHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, linkStyle)}
              >
                {tab.label}
              </a>
            </li>
          ))}

          {/* كبسة تسجيل الدخول */}
          <li>
            <a
              href="/login"
              style={{
                ...linkStyle,
                background: "linear-gradient(90deg, #8e44ad, #f1c40f)",
                borderColor: "#8e44ad",
                color: "#ffffffff",
              }}
              onMouseEnter={(e) => Object.assign(e.target.style, {
                background: "#f1c40f",
                color: "#ffffffff",
                borderColor: "#f1c40f",
              })}
              onMouseLeave={(e) => Object.assign(e.target.style, {
                ...linkStyle,
                background: "linear-gradient(90deg, #8e44ad, #f1c40f)",
                borderColor: "#8e44ad",
                color: "#ffffffff",

              })}
            >
              تسجيل الدخول
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

// src/components/HeaderBackground.jsx
import React from "react";
import '../styles/headerBackground.scss';

const HeaderBackground = () => {
  return (
    <div className="header-background">
      <div className="overlay">
        <h1 className="title">بنك الأهداف | Goals Bank</h1>
        <p className="subtitle">إعداد: فدوى الزغل</p>
      </div>
    </div>
  );
};

export default HeaderBackground;

import React from "react";
// import "./Contact.scss";

const Contact = () => {
  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <h2 className="title">اتصل بنا</h2>
        <p className="subtitle">
          إذا كان لديك أي استفسار أو اقتراح، لا تتردد في مراسلتنا
        </p>
        
        <form className="contact-form">
          <input type="text" placeholder="الاسم الكامل" required />
          <input type="email" placeholder="البريد الإلكتروني" required />
          <textarea placeholder="اكتب رسالتك هنا..." rows="5" required></textarea>
          <button type="submit">إرسال</button>
        </form>
      </div>
    </section>
  );
};

export default Contact;

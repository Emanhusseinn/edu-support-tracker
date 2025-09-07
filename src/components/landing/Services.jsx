import React from "react";

const Services = () => {
  const services = [
    "إعداد الخطط التعليمية الفردية للطلبة",
    "تحديد مستوى الطلبة بشكل دقيق",
    "التقييم المستمر للطلبة",
    "تنفيذ الخطط الداعمة والإثرائية والسلوكية",
    "تقارير تفصيلية لأولياء الأمور",
    "إدارة بيانات الطلبة بشكل آمن وموحد",
    "لوحة تحكم سهلة الاستخدام للمعلمين",
    "تحليل الأداء باستخدام أدوات ذكية"
  ];

  return (
    <section id="services" className="services-section">
      <div className="container">
        <h2 className="title">خدماتنا</h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <h3>{service}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

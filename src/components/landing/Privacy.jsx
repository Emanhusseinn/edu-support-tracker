import React from "react";

const Privacy = () => {
  return (
    <section id="privacy" className="privacy-section">
      <div className="container">
        <h2 className="title">سياسة الخصوصية</h2>
        <p className="text">
          نحن في <span className="highlight">بنك الأهداف</span> نلتزم بحماية خصوصية مستخدمينا. 
          جميع البيانات التي يتم جمعها تستخدم فقط للأغراض التعليمية وتطوير الخطط الفردية للطلبة. 
          لن نقوم بمشاركة معلوماتك مع أي طرف ثالث إلا بإذن صريح منك أو في الحالات التي يفرضها القانون.
        </p>
        <p className="text">
          من خلال استخدام هذا الموقع، فإنك توافق على شروط سياسة الخصوصية هذه. 
          في حال وجود أي تحديثات على هذه السياسة، سيتم إشعارك مباشرة من خلال الموقع.
        </p>
      </div>
    </section>
  );
};

export default Privacy;

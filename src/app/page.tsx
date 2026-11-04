import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1 style={{ fontSize: 56, lineHeight: "72px" }}>آلة الحكايات</h1>
      <p className="muted">حكايات عربية تُصنع معاً، للأطفال وأسرهم.</p>

      <div
        style={{
          display: "grid",
          gap: "var(--space-5)",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          marginTop: "var(--space-6)",
        }}
      >
        <section className="card" style={{ background: "var(--sun)", color: "var(--on-sun)" }}>
          <h2 style={{ fontSize: 40, lineHeight: "56px" }}>للأطفال</h2>
          <p>اختر شخصيتك ومغامرتك، وقرّر كيف تنتهي الحكاية.</p>
          <Link className="btn btn-child" href="/kids">
            هيا نحكي
          </Link>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 28, lineHeight: "40px" }}>للوالدين</h2>
          <p>أنشئوا قصة نوم مخصصة لطفلكم، وأديروا المكتبة والخصوصية.</p>
          <Link className="btn" href="/parents">
            لوحة الوالدين
          </Link>
        </section>
      </div>
    </main>
  );
}

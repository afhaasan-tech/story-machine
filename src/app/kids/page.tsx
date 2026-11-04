import Link from "next/link";

export default function Kids() {
  return (
    <main className="page">
      <h1 style={{ fontSize: 40, lineHeight: "56px" }}>اختر مغامرتك</h1>
      <p className="muted">قريباً: الشخصيات والأماكن والمغامرات.</p>
      <Link className="btn btn-child" href="/">
        رجوع
      </Link>
    </main>
  );
}

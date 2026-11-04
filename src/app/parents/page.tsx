import Link from "next/link";

export default function Parents() {
  return (
    <main className="page">
      <h1 style={{ fontSize: 28, lineHeight: "40px" }}>لوحة الوالدين</h1>
      <p className="muted">قريباً: قصص مخصصة، مكتبة العائلة، والخصوصية.</p>
      <Link className="btn" href="/">
        رجوع
      </Link>
    </main>
  );
}

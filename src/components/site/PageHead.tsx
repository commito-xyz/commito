import Link from "next/link";

/** Sub-page heading: optional back link, eyebrow, big mono title and a lead line. */
export function PageHead({ eyebrow, title, lead, back, children }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; back?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="cm-page-head">
      {back ? (
        <div className="cm-crumbs">
          <Link href={back.href}>← {back.label}</Link>
        </div>
      ) : null}
      <p className="cm-eyebrow">{eyebrow}</p>
      <h1 className="cm-title">{title}</h1>
      {lead ? <p className="cm-lead">{lead}</p> : null}
      {children}
    </div>
  );
}

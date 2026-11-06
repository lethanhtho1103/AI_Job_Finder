export function FeedbackPanel({
  label,
  title,
  children,
  action,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <section className="feedback-panel">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      <p className="text-muted">{children}</p>
      <div className="mt-8">{action}</div>
    </section>
  );
}

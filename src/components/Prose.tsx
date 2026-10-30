export default function Prose({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="card mx-auto my-6 max-w-2xl space-y-4 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="muted text-sm">Last updated: {updated}. This is a placeholder: have a lawyer review it before launching.</p>
      {children}
    </article>
  );
}

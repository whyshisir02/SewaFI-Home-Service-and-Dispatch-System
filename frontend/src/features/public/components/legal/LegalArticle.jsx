export function LegalArticle({ sections = [] }) {
  return (
    <article className="space-y-4">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 sm:p-6">
          <h2 className="text-xl font-bold text-[var(--sf-text-main)] sm:text-2xl">{section.title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--sf-text-muted)] sm:text-base">
            {(section.paragraphs || []).map((paragraph, index) => (
              <p key={`${section.id}-p-${index}`}>{paragraph}</p>
            ))}
            {(section.items || []).length ? (
              <ul className="list-disc space-y-2 pl-5">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </article>
  );
}

export default LegalArticle;


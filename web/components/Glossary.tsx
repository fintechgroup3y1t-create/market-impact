/** ขีดเส้นใต้คำศัพท์ครั้งแรกที่พบในข้อความ */
export function WithGlossary({ text, term }: { text: string; term?: string }) {
  const i = term ? text.indexOf(term) : -1;
  if (!term || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="gloss">{term}</span>
      {text.slice(i + term.length)}
    </>
  );
}

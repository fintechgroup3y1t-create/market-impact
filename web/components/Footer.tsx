/** disclaimer ที่ต้องมีทุกหน้า */
export function Footer({ extra }: { extra?: string }) {
  return (
    <p className="foot">
      {extra && (
        <>
          {extra}
          <br />
        </>
      )}
      ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน
    </p>
  );
}

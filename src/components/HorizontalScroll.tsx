/**
 * 横スクロールカルーセル（Netflix風）。
 *
 * - 各カードは `snap-start shrink-0 w-[XXXpx]` を持つこと
 * - `scrollPaddingLeft` で snap が決まる位置を画面端から 16px に固定
 * - 末尾の `pr-4` で最終カードが右端で半切れにならないように
 */
export function HorizontalScroll({
  children,
  /**
   * 末尾の追加余白。"normal" は16px、"large" は48pxで「次のページのヒント」を強めに。
   */
  trailing = "normal",
}: {
  children: React.ReactNode;
  trailing?: "normal" | "large";
}) {
  return (
    <div
      className="overflow-x-auto scrollbar-none -mx-4 px-4 snap-x snap-mandatory"
      style={{
        scrollPaddingLeft: 16,
        scrollPaddingRight: 16,
      }}
    >
      <div
        className={`flex gap-3 ${trailing === "large" ? "pr-12" : "pr-4"}`}
      >
        {children}
      </div>
    </div>
  );
}

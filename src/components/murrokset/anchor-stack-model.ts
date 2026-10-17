import { ANCHORS } from "./ankkurit-model";
import { anchorPanelData, anchorPanelScale } from "./anchor-panels-model";

/** One canvas and one time projection for every complete anchor arc row. */
export function anchorStackLayout(ids: string[], spacious = false) {
  const scale = anchorPanelScale();
  const width = 1200,
    top = 108,
    rowHeight = spacious ? 160 : 110;
  const x = (year: number) => 220 + ((year - scale.min) / (scale.max - scale.min)) * 940;
  const rows = ANCHORS.filter((a) => ids.includes(a.id)).map((anchor, i) => ({
    anchor,
    data: anchorPanelData(anchor.id),
    top: top + i * rowHeight,
    mid: top + i * rowHeight + rowHeight / 2,
  }));
  return {
    width,
    height: top + rows.length * rowHeight + 28,
    rowHeight,
    rows,
    x,
    min: scale.min,
    max: scale.max,
  };
}

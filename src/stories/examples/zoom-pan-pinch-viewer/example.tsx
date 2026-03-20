import React, { useMemo, useState } from "react";

import { ZoomPanPinchViewer } from "components/zoom-pan-pinch-viewer/zoom-pan-pinch-viewer";
import type { ZoomPanPinchSvgHotspot } from "components/zoom-pan-pinch-viewer/zoom-pan-pinch-viewer";
import { normalizeArgs } from "stories/utils";
import exampleImg from "../../assets/medium-image.jpg";

import styles from "../../utils/styles.module.css";

function circleD(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.01} ${cy} Z`;
}

export const Example: React.FC<any> = (args: any) => {
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const viewBox =
    dims.w > 0 && dims.h > 0 ? `0 0 ${dims.w} ${dims.h}` : "0 0 1 1";

  const paths: ZoomPanPinchSvgHotspot[] = useMemo(() => {
    if (dims.w < 2 || dims.h < 2) return [];
    const r = Math.min(dims.w, dims.h) * 0.08;
    return [
      {
        id: "spot-a",
        d: circleD(dims.w * 0.22, dims.h * 0.28, r),
        label: "Góc trái — zoom tới đây",
      },
      {
        id: "spot-b",
        d: circleD(dims.w * 0.55, dims.h * 0.45, r),
        label: "Giữa ảnh",
      },
      {
        id: "spot-c",
        d: circleD(dims.w * 0.78, dims.h * 0.72, r * 0.9),
        label: "Góc phải dưới",
      },
    ];
  }, [dims]);

  return (
    <ZoomPanPinchViewer
      initialScale={1}
      minScale={0.5}
      maxScale={4}
      centerOnInit
      svgHotspotZoom
      hotspotScale={2.2}
      svgOverlay={{ viewBox, paths }}
      renderToolbar={({ resetTransform }) => (
        <div>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => resetTransform()}
          >
            Reset
          </button>
        </div>
      )}
      transformComponentProps={{
        wrapperStyle: {
          maxWidth: "100%",
          maxHeight: "calc(100vh - 50px)",
        },
      }}
      {...normalizeArgs(args)}
    >
      <img
        alt="demo overlay"
        src={exampleImg}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget;
          setDims({ w: naturalWidth, h: naturalHeight });
        }}
      />
    </ZoomPanPinchViewer>
  );
};

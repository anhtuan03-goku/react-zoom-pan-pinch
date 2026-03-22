import React, { useMemo } from "react";

import { ZoomPanPinchViewer } from "components/zoom-pan-pinch-viewer/zoom-pan-pinch-viewer";
import type { ZoomPanPinchSvgHotspot } from "components/zoom-pan-pinch-viewer/zoom-pan-pinch-viewer";
import { normalizeArgs } from "stories/utils";
import exampleImg from "../../assets/plan.jpg";

import styles from "../../utils/styles.module.css";

export const Example: React.FC<any> = (args: any) => {
  // viewBox nhận từ prop (Storybook args). Mặc định giữ theo SVG bạn cung cấp.
  const viewBox = args.viewBox ?? "0 0 4096 2304";

  const paths: ZoomPanPinchSvgHotspot[] = useMemo(
    () => [
      {
        id: "svg-path-1",
        d: "M650.447 1851.51L675.376 1867.27L747.548 1852.72L738.662 1808.41L645.535 1827.19L650.447 1851.51Z",
        label: "SVG path 1",
      },
      {
        id: "svg-path-2",
        d: "M645.536 1827.19L738.663 1808.41L731.9 1774.78L638.748 1793.71L645.536 1827.19Z",
        label: "SVG path 2",
      },
      {
        id: "svg-path-3",
        d: "M638.748 1793.71L731.9 1774.78L725.161 1741.18L632.01 1760.08L638.748 1793.71Z",
        label: "SVG path 3",
      },
      {
        id: "svg-path-4",
        d: "M725.161 1741.18L716.226 1697L623 1715.73L632.009 1760.08L725.161 1741.18Z",
        label: "SVG path 4",
      },
      {
        id: "svg-path-5",
        d: "M615.732 1685.24L708.859 1666.46L699.974 1622.16L606.723 1640.91L615.732 1685.24Z",
        label: "SVG path 5",
      },
      {
        id: "svg-path-6",
        d: "M606.723 1640.91L699.974 1622.16L693.087 1588.5L599.936 1607.41L606.723 1640.91Z",
        label: "SVG path 6",
      },
      {
        id: "svg-path-7",
        d: "M599.936 1607.41L693.088 1588.5L686.3 1555L593.173 1573.78L599.936 1607.41Z",
        label: "SVG path 7",
      },
      {
        id: "svg-path-8",
        d: "M679.554 1521.4L586.422 1540.18L593.188 1573.8L686.32 1555.02L679.554 1521.4Z",
        label: "SVG path 8",
      },
      {
        id: "svg-path-9",
        d: "M586.434 1540.17L679.536 1521.39L672.798 1487.77L579.646 1506.67L586.434 1540.17Z",
        label: "SVG path 9",
      },
      {
        id: "svg-path-10",
        d: "M579.647 1506.67L672.798 1487.77L666.011 1454.29L572.884 1473.06L579.647 1506.67Z",
        label: "SVG path 10",
      },
      {
        id: "svg-path-11",
        d: "M657.145 1410L564 1428.72L572.884 1473.03L666.029 1454.31L657.145 1410Z",
        label: "SVG path 11",
      },
    ],
    [],
  );

  return (
    <ZoomPanPinchViewer
      responsiveInitialState={{
        desktop: { scale: 1, x: 0, y: 0 },
        tablet: { scale: 1.25, x: 0, y: 0 },
        mobile: { scale: 1.55, x: 0, y: 0 },
      }}
      minScale={1}
      maxScale={4}
      centerOnInit
      svgHotspotZoom
      disablePadding
      hotspotScale={2.2}
      svgOverlay={{
        viewBox,
        paths,
        pathClassName: styles.hotspotPath,
      }}
      renderToolbar={({ zoomIn, zoomOut }, { responsiveReset }) => (
        <div className={styles.controlPanel}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => zoomIn()}
          >
            Zoom in
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => zoomOut()}
          >
            Zoom out
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => responsiveReset()}
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
      />
    </ZoomPanPinchViewer>
  );
};

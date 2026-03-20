/* eslint-disable react/require-default-props */
import React, { useCallback } from "react";

import { animations } from "../../core/animations/animations.constants";
import type {
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchProps,
} from "../../models/context.model";
import { TransformComponent } from "../transform-component/transform-component";
import { TransformWrapper } from "../transform-wrapper/transform-wrapper";

import styles from "./zoom-pan-pinch-viewer.module.css";

export type ZoomPanPinchSvgHotspot = {
  /** id DOM duy nhất (hoặc kết hợp với overlayPathIdPrefix) — dùng cho zoomToElement */
  id: string;
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /** a11y */
  label?: string;
};

export type ZoomPanPinchSvgOverlay = {
  /** Phải trùng hệ tọa độ với ảnh / nội dung bên dưới (ví dụ cùng kích thước pixel gốc) */
  viewBox: string;
  paths: ZoomPanPinchSvgHotspot[];
  preserveAspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Nội dung SVG bổ sung (marker, defs, …) */
  children?: React.ReactNode;
};

type TransformComponentProps = React.ComponentProps<typeof TransformComponent>;

export type ZoomPanPinchViewerProps = Omit<ReactZoomPanPinchProps, "children"> & {
  /** Ảnh, SVG hoặc nội dung được zoom */
  children: React.ReactNode;
  transformComponentProps?: Omit<TransformComponentProps, "children">;
  /** Lớp SVG phủ lên children; viewBox khớp với không gian tọa độ nội dung */
  svgOverlay?: ZoomPanPinchSvgOverlay | null;
  /**
   * true: click vào từng path gọi zoomToElement (animation bay tới vùng path).
   * false: chỉ hiển thị overlay (pointer-events: none), có thể tự xử lý bằng onHotspotPointerDown.
   */
  svgHotspotZoom?: boolean;
  /** Tiền tố id để tránh trùng khi nhiều viewer trên một trang */
  overlayPathIdPrefix?: string;
  hotspotScale?: number;
  hotspotAnimationTime?: number;
  hotspotAnimationType?: keyof typeof animations;
  hotspotOffsetX?: number;
  hotspotOffsetY?: number;
  onHotspotZoom?: (
    hotspotId: string,
    controls: ReactZoomPanPinchContentRef,
  ) => void;
  /** Khi svgHotspotZoom = false, vẫn có thể bắt sự kiện (ví dụ mở tooltip) */
  onHotspotPointerDown?: (
    hotspotId: string,
    event: React.PointerEvent<SVGPathElement>,
    controls: ReactZoomPanPinchContentRef,
  ) => void;
  /** Thanh công cụ / nút reset — nhận cùng API như render-prop của TransformWrapper */
  renderToolbar?: (controls: ReactZoomPanPinchContentRef) => React.ReactNode;
};

const defaultPreserve = "xMidYMid meet";

export const ZoomPanPinchViewer: React.FC<ZoomPanPinchViewerProps> = ({
  children,
  transformComponentProps,
  svgOverlay,
  svgHotspotZoom = false,
  overlayPathIdPrefix = "",
  hotspotScale,
  hotspotAnimationTime = 600,
  hotspotAnimationType = "easeOut",
  hotspotOffsetX = 0,
  hotspotOffsetY = 0,
  onHotspotZoom,
  onHotspotPointerDown,
  renderToolbar,
  ...wrapperProps
}) => {
  const handleHotspotClick = useCallback(
    (
      domId: string,
      logicalId: string,
      ctx: ReactZoomPanPinchContentRef,
      e: React.MouseEvent<SVGPathElement>,
    ) => {
      if (!svgHotspotZoom) return;
      e.stopPropagation();
      e.preventDefault();
      ctx.zoomToElement(
        domId,
        hotspotScale,
        hotspotAnimationTime,
        hotspotAnimationType,
        hotspotOffsetX,
        hotspotOffsetY,
      );
      onHotspotZoom?.(logicalId, ctx);
    },
    [
      svgHotspotZoom,
      hotspotScale,
      hotspotAnimationTime,
      hotspotAnimationType,
      hotspotOffsetX,
      hotspotOffsetY,
      onHotspotZoom,
    ],
  );

  const handleHotspotPointerDown = useCallback(
    (
      logicalId: string,
      ctx: ReactZoomPanPinchContentRef,
      e: React.PointerEvent<SVGPathElement>,
    ) => {
      onHotspotPointerDown?.(logicalId, e, ctx);
    },
    [onHotspotPointerDown],
  );

  const handleHotspotKey = useCallback(
    (
      domId: string,
      logicalId: string,
      ctx: ReactZoomPanPinchContentRef,
      e: React.KeyboardEvent<SVGPathElement>,
    ) => {
      if (!svgHotspotZoom) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      ctx.zoomToElement(
        domId,
        hotspotScale,
        hotspotAnimationTime,
        hotspotAnimationType,
        hotspotOffsetX,
        hotspotOffsetY,
      );
      onHotspotZoom?.(logicalId, ctx);
    },
    [
      svgHotspotZoom,
      hotspotScale,
      hotspotAnimationTime,
      hotspotAnimationType,
      hotspotOffsetX,
      hotspotOffsetY,
      onHotspotZoom,
    ],
  );

  return (
    <TransformWrapper {...wrapperProps}>
      {(ctx) => (
        <>
          {renderToolbar?.(ctx)}
          <TransformComponent {...transformComponentProps}>
            <div className={styles.stack}>
              {children}
              {svgOverlay ? (
                <svg
                  className={`${styles.overlay} ${svgOverlay.className ?? ""}`}
                  viewBox={svgOverlay.viewBox}
                  preserveAspectRatio={
                    svgOverlay.preserveAspectRatio ?? defaultPreserve
                  }
                  style={svgOverlay.style}
                  aria-hidden={
                    svgHotspotZoom || svgOverlay.paths.some((p) => p.label)
                      ? undefined
                      : true
                  }
                >
                  {svgOverlay.children}
                  {svgOverlay.paths.map((p) => {
                    const domId = `${overlayPathIdPrefix}${p.id}`;
                    const interactive =
                      svgHotspotZoom || Boolean(onHotspotPointerDown);
                    return (
                      <path
                        key={domId}
                        id={domId}
                        d={p.d}
                        fill={p.fill ?? "transparent"}
                        stroke={p.stroke}
                        strokeWidth={p.strokeWidth}
                        className={`${p.className ?? ""} ${
                          interactive ? styles.pathClickable : ""
                        }`.trim()}
                        style={p.style}
                        role={svgHotspotZoom ? "button" : undefined}
                        tabIndex={svgHotspotZoom ? 0 : undefined}
                        aria-label={p.label}
                        onClick={(e) =>
                          handleHotspotClick(domId, p.id, ctx, e)
                        }
                        onPointerDown={(e) =>
                          handleHotspotPointerDown(p.id, ctx, e)
                        }
                        onKeyDown={(e) =>
                          handleHotspotKey(domId, p.id, ctx, e)
                        }
                      />
                    );
                  })}
                </svg>
              ) : null}
            </div>
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
};

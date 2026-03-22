/* eslint-disable react/require-default-props */
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";

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
  /**
   * Animation cho hotspot. Hiện hỗ trợ tween `opacity` + `stroke-width` qua CSS keyframes.
   * (Không yêu cầu bạn phải set fill/stroke trong mỗi path).
   */
  animation?: {
    opacityFrom?: number;
    opacityTo?: number;
    strokeWidthFrom?: number | string;
    strokeWidthTo?: number | string;
    duration?: number; // ms
    easing?: string;
    iterationCount?: number | "infinite";
  };
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
  /** CSS chung áp cho tất cả path hotspot (để không phải lặp fill/stroke/opacity trong mỗi path) */
  pathClassName?: string;
  pathStyle?: React.CSSProperties;
  /** Animation tween `opacity` + `stroke-width` áp chung cho mọi path hotspot */
  pathAnimation?: NonNullable<ZoomPanPinchSvgHotspot["animation"]> | null;
  /** Nội dung SVG bổ sung (marker, defs, …) */
  children?: React.ReactNode;
};

export type ViewportState = {
  scale: number;
  x?: number;
  y?: number;
};

export type ResponsiveViewportConfig = {
  desktop: ViewportState;
  tablet?: ViewportState;
  mobile?: ViewportState;
  breakpoints?: {
    tablet: number;
    mobile: number;
  };
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
  renderToolbar?: (
    controls: ReactZoomPanPinchContentRef,
    customControls: { responsiveReset: (speed?: number, type?: string) => void },
  ) => React.ReactNode;

  /**
   * Responsive initial scale & position configuration.
   * Note: This supersedes initialScaleMobile and initialScaleTablet if provided.
   */
  responsiveInitialState?: ResponsiveViewportConfig;

  initialScaleMobile?: number;
  initialScaleTablet?: number;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
};

const defaultPreserve = "xMidYMid meet";

const buildMergedPathClassName = (
  overlay: ZoomPanPinchSvgOverlay,
  hotspot: ZoomPanPinchSvgHotspot,
  interactive: boolean,
  hasAnimation: boolean,
): string => {
  return [
    overlay.pathClassName ?? "",
    hotspot.className ?? "",
    interactive ? styles.pathClickable : "",
    hasAnimation ? styles.pathAnimated : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const buildMergedPathStyle = (
  overlay: ZoomPanPinchSvgOverlay,
  hotspot: ZoomPanPinchSvgHotspot,
  animation:
    | NonNullable<ZoomPanPinchSvgHotspot["animation"]>
    | null
    | undefined,
): React.CSSProperties | undefined => {
  const mergedHasBaseStyle = Boolean(overlay.pathStyle) || Boolean(hotspot.style);
  const mergedHasAnimation =
    Boolean(animation) ||
    Boolean(animation?.strokeWidthFrom) ||
    Boolean(animation?.strokeWidthTo) ||
    Boolean(animation?.opacityFrom) ||
    Boolean(animation?.opacityTo);

  if (!mergedHasBaseStyle && !mergedHasAnimation) return undefined;

  const varsStyle: React.CSSProperties | undefined = animation
    ? {
        [
          "--hotspot-opacity-from" as any
        ]: animation.opacityFrom,
        ["--hotspot-opacity-to" as any]: animation.opacityTo,
        ["--hotspot-stroke-width-from" as any]: animation.strokeWidthFrom,
        ["--hotspot-stroke-width-to" as any]: animation.strokeWidthTo,
        ["--hotspot-duration" as any]: animation.duration
          ? `${animation.duration}ms`
          : undefined,
        ["--hotspot-easing" as any]: animation.easing,
        ["--hotspot-iteration-count" as any]:
          animation.iterationCount ?? "infinite",
      }
    : undefined;

  return {
    ...(overlay.pathStyle ?? {}),
    ...(hotspot.style ?? {}),
    ...(varsStyle ?? {}),
  };
};

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
  initialScale,
  responsiveInitialState,
  initialScaleMobile,
  initialScaleTablet,
  mobileBreakpoint = 768,
  tabletBreakpoint = 1024,
  minScale,
  disablePadding,
  limitToBounds,
  ...wrapperProps
}) => {
  const baseScale = responsiveInitialState?.desktop.scale ?? initialScale ?? 1;
  const basePositionX =
    responsiveInitialState?.desktop.x ?? wrapperProps.initialPositionX ?? 0;
  const basePositionY =
    responsiveInitialState?.desktop.y ?? wrapperProps.initialPositionY ?? 0;

  const getResponsiveState = useCallback(
    (width: number): ViewportState => {
      const defaultBps = { tablet: 1024, mobile: 768 };
      const bps = responsiveInitialState?.breakpoints ?? defaultBps;

      if (width <= bps.mobile) {
        return {
          scale:
            responsiveInitialState?.mobile?.scale ??
            initialScaleMobile ??
            baseScale,
          x: responsiveInitialState?.mobile?.x ?? basePositionX,
          y: responsiveInitialState?.mobile?.y ?? basePositionY,
        };
      }
      if (width <= bps.tablet) {
        return {
          scale:
            responsiveInitialState?.tablet?.scale ??
            initialScaleTablet ??
            baseScale,
          x: responsiveInitialState?.tablet?.x ?? basePositionX,
          y: responsiveInitialState?.tablet?.y ?? basePositionY,
        };
      }
      return {
        scale: baseScale,
        x: basePositionX,
        y: basePositionY,
      };
    },
    [
      responsiveInitialState,
      initialScaleMobile,
      initialScaleTablet,
      baseScale,
      basePositionX,
      basePositionY,
    ],
  );

  const [effectiveInitialState, setEffectiveInitialState] =
    useState<ViewportState>(() => {
      if (typeof window === "undefined") {
        return { scale: baseScale, x: basePositionX, y: basePositionY };
      }
      return getResponsiveState(window.innerWidth);
    });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frameId: number;
    const onResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setEffectiveInitialState(getResponsiveState(window.innerWidth));
      });
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
    };
  }, [getResponsiveState]);

  // Khi người dùng set `minScale = 1` mà vẫn thấy lộ "background", nguyên nhân thường do padding
  // cho phép content đi ngoài bounds. Tự động bật disablePadding trong trường hợp này.
  const effectiveDisablePadding = disablePadding ?? (minScale === 1 ? true : undefined);

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

  const ctxRef = useRef<ReactZoomPanPinchContentRef | null>(null);

  const memoizedSvgPaths = useMemo(() => {
    if (!svgOverlay) return null;
    return svgOverlay.paths.map((p) => {
      const overlay = svgOverlay;
      const domId = `${overlayPathIdPrefix}${p.id}`;
      const interactive = svgHotspotZoom || Boolean(onHotspotPointerDown);

      const animation = p.animation ?? overlay.pathAnimation;
      const hasAnimation = Boolean(animation);
      const hasStrokeWidthAnimation =
        Boolean(animation?.strokeWidthFrom) ||
        Boolean(animation?.strokeWidthTo);

      const mergedClassName = buildMergedPathClassName(
        overlay,
        p,
        interactive,
        hasAnimation,
      );

      const mergedPathStyle = buildMergedPathStyle(
        overlay,
        p,
        animation,
      );

      return (
        <path
          key={domId}
          id={domId}
          d={p.d}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={
            hasStrokeWidthAnimation ? undefined : p.strokeWidth
          }
          className={mergedClassName}
          style={mergedPathStyle}
          role={svgHotspotZoom ? "button" : undefined}
          tabIndex={svgHotspotZoom ? 0 : undefined}
          aria-label={p.label}
          onClick={(e) => {
            if (ctxRef.current) handleHotspotClick(domId, p.id, ctxRef.current, e);
          }}
          onPointerDown={(e) => {
            if (ctxRef.current) handleHotspotPointerDown(p.id, ctxRef.current, e);
          }}
          onKeyDown={(e) => {
            if (ctxRef.current) handleHotspotKey(domId, p.id, ctxRef.current, e);
          }}
        />
      );
    });
  }, [
    svgOverlay,
    overlayPathIdPrefix,
    svgHotspotZoom,
    onHotspotPointerDown,
    handleHotspotClick,
    handleHotspotPointerDown,
    handleHotspotKey,
  ]);

  return (
    <TransformWrapper
      {...wrapperProps}
      initialScale={effectiveInitialState.scale}
      initialPositionX={effectiveInitialState.x}
      initialPositionY={effectiveInitialState.y}
      minScale={minScale}
      disablePadding={effectiveDisablePadding}
      limitToBounds={limitToBounds}
    >
      {(ctx) => {
        ctxRef.current = ctx;

        const responsiveReset = (speed?: number, type?: string) => {
          const currentState = getResponsiveState(window.innerWidth);
          ctx.setTransform(
            currentState.x ?? 0,
            currentState.y ?? 0,
            currentState.scale,
            speed,
            type as any,
          );
        };

        return (
          <>
            {renderToolbar?.(ctx, { responsiveReset })}
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
                    {memoizedSvgPaths}
                  </svg>
                ) : null}
              </div>
            </TransformComponent>
          </>
        );
      }}
    </TransformWrapper>
  );
};

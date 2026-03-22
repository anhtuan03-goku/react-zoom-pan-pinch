# ZoomPanPinchViewer (Standalone Component)

[Tiếng Việt](./README-vi.md) | English

`ZoomPanPinchViewer` is a high-performance, standalone React component that enables smooth zooming, panning, and pinching on any content (images, SVG, or generic HTML elements). It features a native SVG hotspot overlay system, allowing users to map interactive areas over an image.

It is designed as a **self-contained module**, meaning it has no external dependencies other than React. You can simply copy this entire `componentZoomPanPinchViewer` directory directly into your project to start using it immediately!

---

## 🏗️ Folder Structure

```text
componentZoomPanPinchViewer/
├── components/          # React components (Viewer, TransformWrapper, TransformComponent)
├── constants/           # Default configurations and state constants
├── core/                # Core physics engine (animations, boundaries, pan, pinch, wheel, double-click)
├── hooks/               # React hooks for context and effects
├── models/              # TypeScript interfaces and types
├── utils/               # Helper logic (calculations, context extraction, styling, math)
└── index.ts             # Public exports combining all modules
```

---

## 🧠 Logic Summary

The core engine works independently of React's render cycle for performance.
1. **Event Parsing**: Unified handling of `Mouse`, `Touch`, and `Wheel` events.
2. **Physics Engine**: Calculates velocity, friction, and bounce boundaries internally via `requestAnimationFrame` for buttery smooth 60fps animations.
3. **Passive Listeners & Vercel Best Practices**: Throttles resize events via `requestAnimationFrame` and utilizes `{ passive: true }` event listeners to prevent main-thread scrolling blocks on mobile devices.
4. **SVG SVG Overlay Map**: Syncs a transparent `<svg>` viewBox accurately over the scaling content, allowing `<path>` interaction without position distortion.

---

## 🚀 Installation & Setup

1. Copy the `componentZoomPanPinchViewer/` folder to your project (e.g., into `src/components/`).
2. Import the component directly from the folder:

```tsx
import { ZoomPanPinchViewer, ZoomPanPinchViewerProps } from "./path/to/componentZoomPanPinchViewer";
```

---

## 📖 Usage Examples

### 1. Basic Image Viewer
Just wrap the content you want to make zoomable.

```tsx
import React from "react";
import { ZoomPanPinchViewer } from "./componentZoomPanPinchViewer";

export const FloorPlanViewer = () => {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <ZoomPanPinchViewer
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
      >
        <img src="/floor-plan.jpg" alt="Floor Plan" style={{ width: '100%' }} />
      </ZoomPanPinchViewer>
    </div>
  );
};
```

### 2. Advanced: SVG Overlays & Hotspots
Overlay interactive `.svg` hotspots onto an image. The camera zooms securely into the path when clicked.

```tsx
import React from 'react';
import { ZoomPanPinchViewer } from './componentZoomPanPinchViewer';

const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ZoomPanPinchViewer
        minScale={0.2}
        svgHotspotZoom={true} // Enable zooming in on click
        hotspotScale={2.5}     // Camera scale when a hotspot is clicked
        svgOverlay={{
          viewBox: `0 0 1920 1080`, // Must strictly match your image resolution
          pathAnimation: { opacityFrom: 0.4, opacityTo: 1, duration: 2000 },
          paths: [
            {
              id: "living-room",
              d: "M100 100 H 500 V 500 H 100 Z",
              fill: "rgba(255, 0, 0, 0.4)"
            }
          ]
        }}
        renderToolbar={(ctx) => (
          <div style={{ position: "absolute", zIndex: 10 }}>
            <button onClick={() => ctx.zoomIn()}>+</button>
            <button onClick={() => ctx.zoomOut()}>-</button>
          </div>
        )}
      >
        <img src="/floorplan.jpg" width={1920} height={1080} alt="Map" />
      </ZoomPanPinchViewer>
    </div>
  );
};
```

---

## ⚙️ API Reference (Props)

### Core Props
| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `children` | `ReactNode` | **Req** | Content to be transformed. |
| `minScale` | `number` | `1` | Minimum zoom scale allowed. |
| `maxScale` | `number` | `8` | Maximum zoom scale allowed. |
| `initialScale` | `number` | `1` | Starting zoom scale. |
| `initialPositionX` | `number` | `0` | Starting X position. |
| `initialPositionY` | `number` | `0` | Starting Y position. |
| `limitToBounds` | `boolean` | `true` | Restricts panning to the outer edges of the content. |
| `disablePadding` | `boolean` | `false` | Disables edge collision bounce padding. Extracted automatically if `minScale = 1`. |

### Responsive Props
| Prop | Type | Description |
| ---- | ---- | ----------- |
| `responsiveInitialState` | `{ desktop: { scale, x, y }, tablet?: {}, mobile?: {} }` | Sets different dynamic viewport settings depending on device size breakpoints. |

### Hotspot & SVG Props
| Prop | Type | Description |
| ---- | ---- | ----------- |
| `svgOverlay` | `ZoomPanPinchSvgOverlay` | Configuration for SVG overlays. Passes `viewBox` and `paths[]`. |
| `svgHotspotZoom` | `boolean` | If `true`, clicks on an SVG path will execute `zoomToElement`. |
| `hotspotScale` | `number` | Fixed zoom multiple to jump to when a hotspot is clicked. |
| `hotspotAnimationTime` | `number` | Duration of the zoom transition to the hotspot (ms). |
| `onHotspotZoom` | `(id, ctx) => void` | Callback triggered when a hotspot completes zooming. |
| `onHotspotPointerDown` | `(id, event, ctx) => void` | Alternate handler for generic interactive map tooltips without zooming. |

### Custom Interface
| Prop | Type | Description |
| ---- | ---- | ----------- |
| `renderToolbar` | `(ctx, customCtx) => ReactNode` | Render prop for deploying absolute-positioned UI (Zoom In/Out buttons). |

# ZoomPanPinchViewer (Component Độc Lập)

[English](./README.md) | Tiếng Việt

`ZoomPanPinchViewer` là một component React hiệu năng cao, cho phép thao tác thu phóng (zoom), kéo thả (pan), và kẹp ngón tay (pinch) mượt mà lên bất kỳ nội dung nào (ảnh, SVG, HTML). Tính năng đặc biệt hỗ trợ vẽ bản đồ phân vùng qua các hotspot SVG và tương tác nhấp chuột trực tiếp trên ảnh.

Được thiết kế dưỡi dạng một **bộ module hoàn toàn độc lập (self-contained)**, component này không phụ thuộc vào bất kỳ thư viện NPM bên ngoài nào ngoài React. Bạn chỉ cần copy toàn bộ thư mục `componentZoomPanPinchViewer` vào dự án của mình để sử dụng ngay lập tức!

---

## 🏗️ Cấu Trúc Thư Mục (Folder Structure)

```text
componentZoomPanPinchViewer/
├── components/          # React components (Viewer, TransformWrapper, TransformComponent)
├── constants/           # Cấu hình mặc định và hằng số trạng thái
├── core/                # Lõi vật lý engine xử lý (animations, ranh giới bounce, pan, pinch, scroll)
├── hooks/               # React hooks xử lý context và render effect
├── models/              # Định nghĩa giao diện Type (TypeScript interfaces)
├── utils/               # Các hàm tiện ích bổ trợ (Toán học, CSS styles)
└── index.ts             # File xuất tập trung mọi cấu trúc
```

---

## 🧠 Tóm Tắt Logic (Logic Summary)

Core Engine được thiết kế tách rời khỏi chu trình render (vòng lặp vẽ lại) của React để tối ưu 100% hiệu năng.
1. **Phân Rã Sự Kiện**: Thu thập toàn diện và liên kết các sự kiện nền của `Mouse`, `Touch`, và `Wheel`.
2. **Xử Lý Vật Lý**: Các tương tác quán tính, ma sát trượt và bật nảy giới hạn (bounce) được tính toán nội bộ qua `requestAnimationFrame` giúp đạt được ~60fps cho animation.
3. **Thực thi React Vercel Best Practices**: Thêm màng lọc debounce `requestAnimationFrame` khi bắt kích thước window (resize) nhằm tránh giật lắc re-rendering. Khai báo event listener kèm cờ `{ passive: true }` tránh khoá cuộn trên thiết bị di động (mobile scroll blocks).
4. **SVG Hotspot Logic**: Lớp SVG có khung toạ độ (viewBox) đồng nhất phủ đè lên trên bức ảnh thu phóng. Việc này giúp ảnh và bản đồ nhấp chuột sẽ dãn nở/kéo thả đồng vị mà không bao giờ bị lệch.

---

## 🚀 Hướng Dẫn Cài Đặt 

1. Copy nguyên thư mục `componentZoomPanPinchViewer/` vào dự án (ví dụ `src/components/`).
2. Import trực tiếp vào file của bạn:

```tsx
import { ZoomPanPinchViewer, ZoomPanPinchViewerProps } from "./path/to/componentZoomPanPinchViewer";
```

---

## 📖 Hướng Dẫn Sử Dụng (Usage Examples)

### 1. Trình Xem Ảnh Cơ Bản (Basic)
Bọc component quanh bức ảnh của bạn để lập tức kích hoạt kéo/phóng.

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

### 2. Bản Đồ Nâng Cao (SVG Overlays & Hotspots)
Tạo bản đồ có thể tương tác (clickable). Khi người dùng nhấp vào một vùng SVG, camera tự động bay tới vùng đó.

```tsx
import React from 'react';
import { ZoomPanPinchViewer } from './componentZoomPanPinchViewer';

const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ZoomPanPinchViewer
        minScale={0.2}
        svgHotspotZoom={true}  // Kích hoạt nhấp chuột vô vùng path
        hotspotScale={2.5}     // Hệ số zoom bay tới
        svgOverlay={{
          viewBox: `0 0 1920 1080`, // Quan Trọng: Phải y hệt độ phân giải gốc bức ảnh
          pathAnimation: { opacityFrom: 0.4, opacityTo: 1, duration: 2000 },
          paths: [
            {
              id: "phong-khach",
              d: "M100 100 H 500 V 500 H 100 Z",
              fill: "rgba(255, 0, 0, 0.4)"
            }
          ]
        }}
        renderToolbar={(ctx) => (
          <div style={{ position: "absolute", zIndex: 10 }}>
            <button onClick={() => ctx.zoomIn()}>Phóng to</button>
            <button onClick={() => ctx.zoomOut()}>Thu nhỏ</button>
          </div>
        )}
      >
        <img src="/floorplan.jpg" width={1920} height={1080} alt="Bản Đồ" />
      </ZoomPanPinchViewer>
    </div>
  );
};
```

---

## ⚙️ Các Prop Chi Tiết (API Reference)

### Cấu Hình Cốt Lõi (Core Props)
| Prop | Kiểu dữ liệu | Mặc định | Mô tả |
| ---- | ---- | ------- | ----------- |
| `children` | `ReactNode` | **Khai báo** | Nội dung muốn zoom (ví dụ `<img/>`). |
| `minScale` | `number` | `1` | Hệ số thu nhỏ tối đa cho phép. |
| `maxScale` | `number` | `8` | Hệ số phóng to tối đa cho phép. |
| `initialScale` | `number` | `1` | Hệ số zoom khởi điểm. |
| `initialPositionX` | `number` | `0` | Vị trí camera tọa độ X khởi điểm. |
| `initialPositionY` | `number` | `0` | Vị trí camera tọa độ Y khởi điểm. |
| `limitToBounds` | `boolean` | `true` | Chặn kéo khỏi khung viền bức ảnh. |
| `disablePadding` | `boolean` | `false` | Tắt khả năng nảy dội khung viền. Tự gán `true` nếu minScale=1. |

### Cấu Hình Tùy Chỉnh Kích Thước (Responsive)
| Prop | Kiểu dữ liệu | Mô tả |
| ---- | ---- | ----------- |
| `responsiveInitialState` | `{ desktop: { scale, x, y }, tablet?: {}, mobile?: {} }` | Hệ thống tự kiểm tra và đặt scale mở đầu theo từng kích thước màn hình người dùng. Mượt hơn CSS media queries. |

### Cấu Hình Tương Tác Map SVG (SVG Hotspots)
| Prop | Kiểu dữ liệu | Mô tả |
| ---- | ---- | ----------- |
| `svgOverlay` | `ZoomPanPinchSvgOverlay` | Đối tượng thiết đặt SVG và danh sách toạ độ path poly-lines. Xem ví dụ. |
| `svgHotspotZoom` | `boolean` | Gán `true` nếu muốn ấn click vô path thì bay (zoomToElement). |
| `hotspotScale` | `number` | Khóa tỷ lệ zoom khi click bay đến vùng path. Nếu trống, tự tính độ khít. |
| `hotspotAnimationTime` | `number` | Khung thời gian (ms) bay đến mục tiêu. |
| `onHotspotZoom` | `(id, ctx) => void` | Sự kiện trigger ngay sau khi click xong vô path hotspot. |
| `onHotspotPointerDown` | `(id, event, ctx) => void` | Handler tùy biến dành cho logic tạo tooltips khi chĩa vào vùng đất trên map. |

### Giao Diện (UI Toolbar)
| Prop | Kiểu dữ liệu | Mô tả |
| ---- | ---- | ----------- |
| `renderToolbar` | `(ctx, customCtx) => ReactNode` | Prop chuyên dùng render các thẻ nút lệnh bay tự do đè lên trên layer canvas. Mở khoá hàm `ctx.zoomIn()`, `ctx.zoomOut()`, `ctx.resetTransform()`, v.v... |

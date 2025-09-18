import { useRef } from 'react';

export const useInteractionStates = () => {
  // 性能優化相關的 ref
  const animationFrameRef = useRef(null);
  const needsRedraw = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const throttleTimer = useRef(null);

  // 拖拽狀態
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 縮放狀態
  const isResizingRef = useRef(false);
  const resizeTypeRef = useRef(null); // 儲存縮放類型
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });
  const initialPositionRef = useRef({ x: 0, y: 0 }); // 儲存初始位置

  return {
    animationFrameRef,
    needsRedraw,
    lastMousePosition,
    throttleTimer,
    isDraggingRef,
    dragOffsetRef,
    isResizingRef,
    resizeTypeRef,
    initialSizeRef,
    initialMouseRef,
    initialPositionRef,
  };
};

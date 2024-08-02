/* eslint-disable react/prop-types */
import { createContext, useRef } from 'react';
import { virtualCanvasSize } from '../constant/size';

export const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
  // 主畫布
  const canvasRef = useRef(null);

  //  主畫布的 context
  const contextRef = useRef(null);

  // 虛擬畫布
  const virtualCanvasRef = useRef(document.createElement('canvas'));

  // 虛擬畫布的 context
  const virtualContextRef = useRef(null);

  // 處理虛擬畫布的背景繪製（方格）
  const createVirtualCanvasBg = () => {
    const virtualContext = virtualContextRef.current;
    virtualContext.strokeStyle = '#ddd';
    virtualContext.lineWidth = 1;

    // 繪製垂直線（相隔單位 50）
    for (let x = 0; x <= virtualCanvasSize.width; x += 50) {
      virtualContext.beginPath();
      virtualContext.moveTo(x, 0);
      virtualContext.lineTo(x, virtualCanvasSize.height);
      virtualContext.stroke();
    }

    // 繪製水平線（相隔單位 50）
    for (let y = 0; y <= virtualCanvasSize.height; y += 50) {
      virtualContext.beginPath();
      virtualContext.moveTo(0, y);
      virtualContext.lineTo(virtualCanvasSize.width, y);
      virtualContext.stroke();
    }
  };

  // 處理主畫布中的可視區域
  const updateVisibleCanvas = () => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const xOffset = window.scrollX || document.documentElement.scrollLeft;
    const yOffset = window.scrollX || document.documentElement.scrollTop;

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.drawImage(
      virtualCanvas,
      xOffset,
      yOffset,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  const value = {
    canvasRef,
    contextRef,
    virtualCanvasRef,
    virtualContextRef,
    createVirtualCanvasBg,
    updateVisibleCanvas,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

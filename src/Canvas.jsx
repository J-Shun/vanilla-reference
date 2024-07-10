/* eslint-disable no-unused-vars */
import { useEffect } from 'react';
import useCanvas from './hooks/useCanvas';
import { drawVirtualCanvas } from './helper/canvasHelper';

const virtualCanvasSize = { width: 5000, height: 5000 };

export const Canvas = () => {
  // 主畫布、虛擬畫布的主體和 2D context
  const { canvasRef, contextRef, virtualCanvasRef, virtualContextRef } =
    useCanvas();

  useEffect(() => {
    // 處理虛擬畫布的初始尺寸
    const virtualCanvas = virtualCanvasRef.current;
    virtualCanvas.width = virtualCanvasSize.width;
    virtualCanvas.height = virtualCanvasSize.height;

    // 在虛擬畫布上繪製圖形（方格背景）
    virtualContextRef.current = virtualCanvas.getContext('2d');
    drawVirtualCanvas(virtualContextRef.current);

    // 初始化主畫布和環境
    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext('2d');

    // 處理主畫布的尺寸變動（RWD）
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateVisibleCanvas();
    };

    // 處理滾動
    const updateVisibleCanvas = () => {
      const context = contextRef.current;
      const xOffset = window.pageXOffset || document.documentElement.scrollLeft;
      const yOffset = window.pageYOffset || document.documentElement.scrollTop;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
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

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateVisibleCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateVisibleCanvas);
    };
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

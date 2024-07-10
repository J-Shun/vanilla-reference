/* eslint-disable no-unused-vars */
import { useEffect } from 'react';
import useCanvas from './hooks/useCanvas';
import {
  drawVirtualCanvas,
  updateVisibleCanvas,
  convertToGrayScale,
} from './helper/canvasHelper';
import { virtualCanvasSize } from './constant/size';

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
    const canvasContext = contextRef.current;

    // 處理主畫布的尺寸變動（RWD）
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateVisibleCanvas({ canvas, canvasContext, virtualCanvas });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  /**
   * 圖片丟入 canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;

    const virtualCanvas = virtualCanvasRef.current;
    const virtualContext = virtualContextRef.current;

    const dragAndDrop = ['dragenter', 'dragover', 'dragleave', 'drop'];

    // 防止瀏覽器預設行為（如：開啟）
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 處理拖放事件
    const handleDrop = (e) => {
      const dataTransfer = e.dataTransfer;
      const file = dataTransfer.files[0];

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 計算圖片置中要放的位置
          const widthCenter = canvas.width / 2 - img.width / 2;
          const heightCenter = canvas.height / 2 - img.height / 2;

          // 將圖片繪製到虛擬畫布上
          virtualContext.drawImage(
            img,
            widthCenter,
            heightCenter,
            img.width,
            img.height
          );

          // 將虛擬畫布上的圖片繪製到主畫布上
          canvasContext.drawImage(
            virtualCanvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    };

    // 加入事件監聽器
    const addEventListeners = () => {
      dragAndDrop.forEach((event) => {
        canvas.addEventListener(event, preventDefaults, false);
      });
      canvas.addEventListener('drop', handleDrop, false);
    };

    // 移除事件監聽器
    const removeEventListeners = () => {
      dragAndDrop.forEach((event) => {
        canvas.removeEventListener(event, preventDefaults, false);
      });
      canvas.removeEventListener('drop', handleDrop, false);
    };

    addEventListeners();

    // 清理函數以解除事件監聽器
    return () => removeEventListeners();
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  // 先簡單處理，點擊後直接將圖片轉灰階
  const handleClick = () => {
    convertToGrayScale({
      canvas: canvasRef.current,
      canvasContext: contextRef.current,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
      onClick={handleClick}
    />
  );
};

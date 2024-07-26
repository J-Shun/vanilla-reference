/* eslint-disable no-unused-vars */
import { useEffect, useRef } from 'react';
import useCanvas from './hooks/useCanvas';
import {
  createVirtualCanvasBg,
  updateVisibleCanvas,
  convertToGrayScale,
  applySepiaEffect,
} from './helper/canvasHelper';
import { virtualCanvasSize } from './constant/size';
import { preventDefaults } from './helper/commonHelper';

const dragDropEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];

export const Canvas = () => {
  // 主畫布、虛擬畫布的主體和 2D context
  const { canvasRef, contextRef, virtualCanvasRef, virtualContextRef } =
    useCanvas();

  // 存放圖片資訊的 ref array，方便針對圖片進行操作
  const imagesRef = useRef([]);

  useEffect(() => {
    // 處理虛擬畫布的初始尺寸
    const virtualCanvas = virtualCanvasRef.current;
    virtualCanvas.width = virtualCanvasSize.width;
    virtualCanvas.height = virtualCanvasSize.height;

    // 在虛擬畫布上繪製圖形（方格背景）
    virtualContextRef.current = virtualCanvas.getContext('2d');
    createVirtualCanvasBg({ context: virtualContextRef.current });

    // 初始化主畫布和環境
    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext('2d');

    // 處理主畫布的尺寸變動（RWD）
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateVisibleCanvas({
        canvas,
        canvasContext: contextRef.current,
        virtualCanvas,
      });
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

    // 處理拖放事件
    const handleDrop = (e) => {
      const dataTransfer = e.dataTransfer;
      const file = dataTransfer.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 計算圖片置中要放的位置
          const widthCenter = canvas.width / 2 - img.width / 2;
          const heightCenter = canvas.height / 2 - img.height / 2;

          // 將圖片資訊存入 ref
          imagesRef.current.push({
            id: crypto.randomUUID(),
            src: e.target.result,
            x: widthCenter,
            y: heightCenter,
            width: img.width,
            height: img.height,
          });

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
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // 加入事件監聽器
    dragDropEvents.forEach((e) => {
      canvas.addEventListener(e, preventDefaults);
    });
    canvas.addEventListener('drop', handleDrop);

    // 清理函數以解除事件監聽器
    return () => {
      dragDropEvents.forEach((e) => {
        canvas.removeEventListener(e, preventDefaults);
      });
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  // 先簡單處理，點擊後直接將圖片轉灰階
  const handleClick = () => {
    // convertToGrayScale({
    //   canvas: canvasRef.current,
    //   canvasContext: contextRef.current,
    //   virtualContext: virtualContextRef.current,
    // });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
      onClick={handleClick}
    />
  );
};

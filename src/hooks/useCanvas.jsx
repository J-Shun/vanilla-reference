import { useEffect, useRef } from 'react';
import { virtualCanvasSize } from '../constant/size';
import { preventDefaults } from '../helper/commonHelper';

const dragDropEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];

const useCanvas = () => {
  // 主畫布
  const canvasRef = useRef(null);

  //  主畫布的 context
  const contextRef = useRef(null);

  // 虛擬畫布
  const virtualCanvasRef = useRef(document.createElement('canvas'));

  // 虛擬畫布的 context
  const virtualContextRef = useRef(null);

  // 存放圖片資訊的 ref array，方便針對圖片進行操作
  const imagesRef = useRef([]);

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

  useEffect(() => {
    // 處理虛擬畫布的初始尺寸
    const virtualCanvas = virtualCanvasRef.current;
    virtualCanvas.width = virtualCanvasSize.width;
    virtualCanvas.height = virtualCanvasSize.height;

    // 在虛擬畫布上繪製圖形（方格背景）
    virtualContextRef.current = virtualCanvas.getContext('2d');
    createVirtualCanvasBg();

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

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

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
  }, []);

  return {
    canvasRef,
  };
};

export default useCanvas;

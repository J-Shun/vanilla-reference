import { useEffect, useRef, useCallback } from 'react';
import useCanvas from './hooks/useCanvas';
import { resizeCanvas, loadGrid, redrawImages } from './canvas/helper';

export const Canvas = () => {
  const canvasRef = useCanvas();
  const offscreenCanvasRef = useRef(document.createElement('canvas'));
  const resizeTimeoutRef = useRef(null);
  const imagesRef = useRef([]);

  /**
   * 使用 debounce 防抖
   * 透過 useCallback 確保不會每次渲染都重新創建
   */
  const debounceRerender = useCallback(() => {
    if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

    resizeTimeoutRef.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      const offscreenCanvas = offscreenCanvasRef.current;
      if (!canvas || offscreenCanvas) return;

      resizeCanvas({ canvas });
      resizeCanvas({ canvas: offscreenCanvas });
      await loadGrid({ canvas: offscreenCanvas });
      // TODO: 是否需要 promise?
      redrawImages({ offscreenCanvas, images: imagesRef.current });
      canvas.getContext('2d').drawImage(offscreenCanvas, 0, 0);
    }, 100);
  }, [canvasRef]);

  /**
   * 確保 canvas 佔滿整個畫面，寬高隨視窗大小變動
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!canvas || !offscreenCanvas) return;

    const renderCanvas = async () => {
      resizeCanvas({ canvas });
      resizeCanvas({ canvas: offscreenCanvas });
      await loadGrid({ canvas: offscreenCanvas });
      redrawImages({ offscreenCanvas, images: imagesRef.current });
      canvas.getContext('2d').drawImage(offscreenCanvas, 0, 0);
    };

    renderCanvas();

    window.addEventListener('resize', debounceRerender);
    return () => {
      clearTimeout(resizeTimeoutRef.current);
      window.removeEventListener('resize', debounceRerender);
    };
  }, [canvasRef, debounceRerender]);

  /**
   * 圖片丟入 canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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

      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const widthCenter = canvas.width / 2 - img.width / 2;
          const heightCenter = canvas.height / 2 - img.height / 2;
          // 繪製圖片
          ctx.drawImage(img, widthCenter, heightCenter, img.width, img.height);

          // 將圖片資訊存入 state
          imagesRef.current.push({
            src: event.target.result,
            x: widthCenter,
            y: heightCenter,
            width: img.width,
            height: img.height,
          });

          // 重繪到 offscreenCanvas
          const offscreenCanvas = offscreenCanvasRef.current;
          redrawImages({ offscreenCanvas, images: imagesRef.current });

          // 從 offscreenCanvas 重繪到 canvas
          ctx.drawImage(offscreenCanvas, 0, 0);
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
    addEventListeners();

    // 移除事件監聽器
    const removeEventListeners = () => {
      dragAndDrop.forEach((event) => {
        canvas.removeEventListener(event, preventDefaults, false);
      });
      canvas.removeEventListener('drop', handleDrop, false);
    };

    return () => removeEventListeners();
  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

import { useEffect } from 'react';
import useCanvas from './hooks/useCanvas';

export const Canvas = () => {
  const canvasRef = useCanvas();

  /**
   * 確保 canvas 佔滿整個畫面，寬高隨視窗大小變動
   */
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 保存當前圖片數據
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 重新繪製圖片數據
      ctx.putImageData(imgData, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef]);

  /**
   * 圖片丟入 canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
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

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const widthCenter = canvas.width / 2 - img.width / 2;
          const heightCenter = canvas.height / 2 - img.height / 2;
          // 繪製圖片
          ctx.drawImage(img, widthCenter, heightCenter, img.width, img.height);
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
  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

import { useEffect, useRef } from 'react';

export const Canvas = () => {
  const canvasRef = useRef(null);

  /**
   * 確保 canvas 佔滿整個畫面，寬高隨視窗大小變動
   */
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

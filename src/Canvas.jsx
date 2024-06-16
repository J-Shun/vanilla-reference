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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

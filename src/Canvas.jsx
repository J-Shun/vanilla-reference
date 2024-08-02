/* eslint-disable no-unused-vars */
import { useContext } from 'react';
import { CanvasContext } from './context/CanvasProvider';

export const Canvas = () => {
  const { canvasRef } = useContext(CanvasContext);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

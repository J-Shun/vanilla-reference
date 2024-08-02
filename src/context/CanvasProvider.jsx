/* eslint-disable react/prop-types */
import { createContext } from 'react';
import useCanvas from '../hooks/useCanvas';

export const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
  const { canvasRef } = useCanvas();

  const value = {
    canvasRef,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

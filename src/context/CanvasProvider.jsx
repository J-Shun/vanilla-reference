/* eslint-disable react/prop-types */
import { createContext, useRef } from 'react';

export const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
  const canvasRef = useRef(null);

  return (
    <CanvasContext.Provider value={canvasRef}>
      {children}
    </CanvasContext.Provider>
  );
};

/* eslint-disable react/prop-types */
import { createContext, useRef } from 'react';

export const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
  // 主畫布
  const canvasRef = useRef(null);

  //  主畫布的 context
  const contextRef = useRef(null);

  // 虛擬畫布
  const virtualCanvasRef = useRef(document.createElement('canvas'));

  // 虛擬畫布的 context
  const virtualContextRef = useRef(null);

  const value = {
    canvasRef,
    contextRef,
    virtualCanvasRef,
    virtualContextRef,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

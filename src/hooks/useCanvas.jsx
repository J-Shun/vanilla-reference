import { useContext } from 'react';
import { CanvasContext } from '../context/CanvasProvider';

const useCanvas = () => {
  return useContext(CanvasContext);
};

export default useCanvas;

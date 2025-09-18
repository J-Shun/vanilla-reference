import { useState } from 'react';

export const useEyedropper = () => {
  // 吸管工具狀態
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [eyedropperColor, setEyedropperColor] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [previewColor, setPreviewColor] = useState(null);

  const toggleEyedropper = () => {
    const newState = !isEyedropperActive;
    setIsEyedropperActive(newState);

    // 關閉吸管工具時清除預覽顏色
    if (!newState) {
      setPreviewColor(null);
    }
  };

  return {
    isEyedropperActive,
    eyedropperColor,
    mousePosition,
    previewColor,
    setEyedropperColor,
    setMousePosition,
    setPreviewColor,
    toggleEyedropper,
  };
};

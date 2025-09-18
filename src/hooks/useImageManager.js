import { useRef, useState, useCallback } from 'react';

export const useImageManager = () => {
  // 存放圖片資訊的 ref array，方便針對圖片進行操作
  const imagesRef = useRef([]);

  // 緩存已載入的圖片對象，避免重複載入造成閃爍
  const imageObjectsRef = useRef(new Map());

  // 選中的圖片 ID
  const selectedImageRef = useRef(null);

  // 用於觸發重新渲染的狀態
  const [selectedImageId, setSelectedImageId] = useState(null);

  // 用於強制重新渲染的狀態
  const [forceUpdate, setForceUpdate] = useState(0);

  // 添加圖片
  const addImage = useCallback((imageData) => {
    imagesRef.current.push(imageData);
  }, []);

  // 刪除選中的圖片
  const deleteSelectedImage = useCallback(() => {
    if (selectedImageRef.current) {
      // 從緩存中移除圖片對象
      imageObjectsRef.current.delete(selectedImageRef.current);

      // 從圖片陣列中移除選中的圖片
      imagesRef.current = imagesRef.current.filter(
        (img) => img.id !== selectedImageRef.current
      );

      // 清除選取狀態
      selectedImageRef.current = null;
      setSelectedImageId(null);
    }
  }, []);

  // 選中圖片
  const selectImage = useCallback((imageId) => {
    selectedImageRef.current = imageId;
    setSelectedImageId(imageId);
  }, []);

  // 取消選中
  const deselectImage = useCallback(() => {
    selectedImageRef.current = null;
    setSelectedImageId(null);
  }, []);

  // 強制更新
  const forceUpdateImages = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  return {
    imagesRef,
    imageObjectsRef,
    selectedImageRef,
    selectedImageId,
    forceUpdate,
    addImage,
    deleteSelectedImage,
    selectImage,
    deselectImage,
    forceUpdateImages,
  };
};

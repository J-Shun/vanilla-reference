/* eslint-disable no-unused-vars */
import { useEffect, useRef, useCallback } from 'react';
import useCanvas from './hooks/useCanvas';
import {
  createVirtualCanvasBg,
  updateVisibleCanvas,
} from './helper/canvasHelper';
import { virtualCanvasSize } from './constant/size';
import { preventDefaults } from './helper/commonHelper';

const dragDropEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];

export const Canvas = () => {
  // 主畫布、虛擬畫布的主體和 2D context
  const { canvasRef, contextRef, virtualCanvasRef, virtualContextRef } =
    useCanvas();

  // 存放圖片資訊的 ref array，方便針對圖片進行操作
  const imagesRef = useRef([]);

  // 選中的圖片 ID
  const selectedImageRef = useRef(null);

  // 拖拽狀態
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 縮放狀態
  const isResizingRef = useRef(false);
  const resizeTypeRef = useRef(null); // 儲存縮放類型
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });
  const initialPositionRef = useRef({ x: 0, y: 0 }); // 儲存初始位置

  useEffect(() => {
    // 處理虛擬畫布的初始尺寸
    const virtualCanvas = virtualCanvasRef.current;
    virtualCanvas.width = virtualCanvasSize.width;
    virtualCanvas.height = virtualCanvasSize.height;

    // 在虛擬畫布上繪製圖形（方格背景）
    virtualContextRef.current = virtualCanvas.getContext('2d');
    createVirtualCanvasBg({ context: virtualContextRef.current });

    // 初始化主畫布和環境
    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext('2d');

    // 處理主畫布的尺寸變動（RWD）
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateVisibleCanvas({
        canvas,
        canvasContext: contextRef.current,
        virtualCanvas,
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  // 檢測點擊是否在圖片範圍內
  const getClickedImage = (x, y) => {
    // 從後面開始檢查，因為後加入的圖片在上層
    for (let i = imagesRef.current.length - 1; i >= 0; i--) {
      const img = imagesRef.current[i];
      if (
        x >= img.x &&
        x <= img.x + img.width &&
        y >= img.y &&
        y <= img.y + img.height
      ) {
        return img;
      }
    }
    return null;
  };

  // 檢測是否點擊到縮放控制區域（圖片邊緣）
  const getResizeHandle = (x, y, image) => {
    if (!image) return null;

    const edgeThreshold = 15; // 邊緣檢測的範圍（像素）
    const cornerThreshold = 30; // 角落檢測的範圍（像素）

    const isInImage =
      x >= image.x &&
      x <= image.x + image.width &&
      y >= image.y &&
      y <= image.y + image.height;

    if (!isInImage) return null;

    // 檢測角落（等比例縮放）
    if (
      (x <= image.x + cornerThreshold && y <= image.y + cornerThreshold) ||
      (x >= image.x + image.width - cornerThreshold &&
        y <= image.y + cornerThreshold) ||
      (x <= image.x + cornerThreshold &&
        y >= image.y + image.height - cornerThreshold) ||
      (x >= image.x + image.width - cornerThreshold &&
        y >= image.y + image.height - cornerThreshold)
    ) {
      if (x <= image.x + cornerThreshold && y <= image.y + cornerThreshold)
        return 'nw-corner';
      if (
        x >= image.x + image.width - cornerThreshold &&
        y <= image.y + cornerThreshold
      )
        return 'ne-corner';
      if (
        x <= image.x + cornerThreshold &&
        y >= image.y + image.height - cornerThreshold
      )
        return 'sw-corner';
      if (
        x >= image.x + image.width - cornerThreshold &&
        y >= image.y + image.height - cornerThreshold
      )
        return 'se-corner';
    }

    // 檢測邊緣（單向縮放）
    if (x <= image.x + edgeThreshold) return 'w-edge'; // 左邊緣
    if (x >= image.x + image.width - edgeThreshold) return 'e-edge'; // 右邊緣
    if (y <= image.y + edgeThreshold) return 'n-edge'; // 上邊緣
    if (y >= image.y + image.height - edgeThreshold) return 's-edge'; // 下邊緣

    return null;
  };

  // 重新繪製所有圖片和選擇框
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const virtualContext = virtualContextRef.current;

    if (!canvas || !canvasContext || !virtualCanvas || !virtualContext) return;

    // 清空虛擬畫布並重繪背景
    virtualContext.clearRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    createVirtualCanvasBg({ context: virtualContext });

    // 使用 Promise 來處理圖片載入
    const imagePromises = imagesRef.current.map((imgData) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          virtualContext.drawImage(
            img,
            imgData.x,
            imgData.y,
            imgData.width,
            imgData.height
          );

          // 如果是選中的圖片，繪製虛線框和縮放控制點
          if (selectedImageRef.current === imgData.id) {
            virtualContext.save();

            // 繪製虛線框
            virtualContext.strokeStyle = '#ff0000';
            virtualContext.lineWidth = 2;
            virtualContext.setLineDash([5, 5]);
            virtualContext.strokeRect(
              imgData.x,
              imgData.y,
              imgData.width,
              imgData.height
            );

            // 繪製縮放控制區域提示（邊緣高亮）
            const edgeThreshold = 15;
            const cornerThreshold = 30;

            virtualContext.save();
            virtualContext.strokeStyle = '#ff0000';
            virtualContext.lineWidth = 1;
            virtualContext.setLineDash([3, 3]);

            // 繪製邊緣區域
            // 左邊緣
            virtualContext.strokeRect(
              imgData.x,
              imgData.y,
              edgeThreshold,
              imgData.height
            );
            // 右邊緣
            virtualContext.strokeRect(
              imgData.x + imgData.width - edgeThreshold,
              imgData.y,
              edgeThreshold,
              imgData.height
            );
            // 上邊緣
            virtualContext.strokeRect(
              imgData.x,
              imgData.y,
              imgData.width,
              edgeThreshold
            );
            // 下邊緣
            virtualContext.strokeRect(
              imgData.x,
              imgData.y + imgData.height - edgeThreshold,
              imgData.width,
              edgeThreshold
            );

            // 繪製角落區域（更明顯的標示）
            virtualContext.setLineDash([]);
            virtualContext.fillStyle = 'rgba(255, 0, 0, 0.2)';
            // 四個角落
            virtualContext.fillRect(
              imgData.x,
              imgData.y,
              cornerThreshold,
              cornerThreshold
            );
            virtualContext.fillRect(
              imgData.x + imgData.width - cornerThreshold,
              imgData.y,
              cornerThreshold,
              cornerThreshold
            );
            virtualContext.fillRect(
              imgData.x,
              imgData.y + imgData.height - cornerThreshold,
              cornerThreshold,
              cornerThreshold
            );
            virtualContext.fillRect(
              imgData.x + imgData.width - cornerThreshold,
              imgData.y + imgData.height - cornerThreshold,
              cornerThreshold,
              cornerThreshold
            );

            virtualContext.restore();
          }
          resolve();
        };
        img.src = imgData.src;
      });
    });

    // 等所有圖片載入完成後更新主畫布
    Promise.all(imagePromises).then(() => {
      updateVisibleCanvas({
        canvas,
        canvasContext,
        virtualCanvas,
      });
    });
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  /**
   * 圖片丟入 canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const virtualContext = virtualContextRef.current;

    // 處理拖放事件
    const handleDrop = (e) => {
      const dataTransfer = e.dataTransfer;
      const file = dataTransfer.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 計算圖片置中要放的位置
          const widthCenter = canvas.width / 2 - img.width / 2;
          const heightCenter = canvas.height / 2 - img.height / 2;

          // 將圖片資訊存入 ref
          imagesRef.current.push({
            id: crypto.randomUUID(),
            src: e.target.result,
            x: widthCenter,
            y: heightCenter,
            width: img.width,
            height: img.height,
          });

          // 將圖片繪製到虛擬畫布上
          virtualContext.drawImage(
            img,
            widthCenter,
            heightCenter,
            img.width,
            img.height
          );

          // 將虛擬畫布上的圖片繪製到主畫布上
          canvasContext.drawImage(
            virtualCanvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // 加入事件監聽器
    dragDropEvents.forEach((e) => {
      canvas.addEventListener(e, preventDefaults);
    });
    canvas.addEventListener('drop', handleDrop);

    // 清理函數以解除事件監聽器
    return () => {
      dragDropEvents.forEach((e) => {
        canvas.removeEventListener(e, preventDefaults);
      });
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [canvasRef, contextRef, virtualCanvasRef, virtualContextRef]);

  // 處理點擊事件（現在主要用於處理一些其他邏輯，選取已在 mouseDown 中處理）
  const handleClick = (e) => {
    // 點擊事件的主要邏輯已移到 handleMouseDown 中處理
    // 這裡保留以備未來需要其他點擊邏輯
  };

  // 處理鼠標按下事件
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 計算點擊位置相對於虛擬畫布的座標
    const x =
      e.clientX -
      rect.left +
      (window.scrollX || document.documentElement.scrollLeft);
    const y =
      e.clientY -
      rect.top +
      (window.scrollY || document.documentElement.scrollTop);

    // 檢查是否點擊到任何圖片
    const clickedImage = getClickedImage(x, y);

    if (clickedImage) {
      // 自動選中點擊的圖片
      selectedImageRef.current = clickedImage.id;

      // 檢查是否點擊到縮放控制區域
      const resizeHandle = getResizeHandle(x, y, clickedImage);
      if (resizeHandle) {
        isResizingRef.current = true;
        resizeTypeRef.current = resizeHandle;
        initialSizeRef.current = {
          width: clickedImage.width,
          height: clickedImage.height,
        };
        initialPositionRef.current = {
          x: clickedImage.x,
          y: clickedImage.y,
        };
        initialMouseRef.current = { x, y };

        // 根據縮放類型設定游標
        if (resizeHandle.includes('corner')) {
          canvas.style.cursor = 'nw-resize';
        } else if (
          resizeHandle.includes('e-edge') ||
          resizeHandle.includes('w-edge')
        ) {
          canvas.style.cursor = 'ew-resize';
        } else if (
          resizeHandle.includes('n-edge') ||
          resizeHandle.includes('s-edge')
        ) {
          canvas.style.cursor = 'ns-resize';
        }
      } else {
        // 直接開始拖拽
        isDraggingRef.current = true;
        dragOffsetRef.current = {
          x: x - clickedImage.x,
          y: y - clickedImage.y,
        };
        canvas.style.cursor = 'grabbing';
      }

      // 重新繪製畫布以顯示選取框
      redrawCanvas();
    } else {
      // 點擊空白處，取消選取
      selectedImageRef.current = null;
      redrawCanvas();
    }
  };

  // 處理鼠標移動事件
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 計算滑鼠位置
    const x =
      e.clientX -
      rect.left +
      (window.scrollX || document.documentElement.scrollLeft);
    const y =
      e.clientY -
      rect.top +
      (window.scrollY || document.documentElement.scrollTop);

    if (isResizingRef.current && selectedImageRef.current) {
      // 縮放模式
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        const deltaX = x - initialMouseRef.current.x;
        const deltaY = y - initialMouseRef.current.y;

        const resizeType = resizeTypeRef.current;

        if (resizeType.includes('corner')) {
          // 角落縮放 - 等比例縮放，跟隨滑鼠位置
          let newWidth, newHeight;

          if (resizeType === 'se-corner') {
            // 右下角：滑鼠位置就是新的右下角
            newWidth = Math.max(20, x - initialPositionRef.current.x);
            newHeight = Math.max(20, y - initialPositionRef.current.y);
          } else if (resizeType === 'nw-corner') {
            // 左上角：滑鼠位置就是新的左上角
            newWidth = Math.max(
              20,
              initialPositionRef.current.x + initialSizeRef.current.width - x
            );
            newHeight = Math.max(
              20,
              initialPositionRef.current.y + initialSizeRef.current.height - y
            );
          } else if (resizeType === 'ne-corner') {
            // 右上角：滑鼠X是右邊界，滑鼠Y是上邊界
            newWidth = Math.max(20, x - initialPositionRef.current.x);
            newHeight = Math.max(
              20,
              initialPositionRef.current.y + initialSizeRef.current.height - y
            );
          } else if (resizeType === 'sw-corner') {
            // 左下角：滑鼠X是左邊界，滑鼠Y是下邊界
            newWidth = Math.max(
              20,
              initialPositionRef.current.x + initialSizeRef.current.width - x
            );
            newHeight = Math.max(20, y - initialPositionRef.current.y);
          }

          // 計算等比例縮放
          const aspectRatio =
            initialSizeRef.current.width / initialSizeRef.current.height;
          const widthScale = newWidth / initialSizeRef.current.width;
          const heightScale = newHeight / initialSizeRef.current.height;

          // 選擇較小的縮放比例以保持長寬比並確保不超過滑鼠位置
          const scale = Math.min(widthScale, heightScale);

          selectedImage.width = Math.max(
            20,
            initialSizeRef.current.width * scale
          );
          selectedImage.height = Math.max(
            20,
            initialSizeRef.current.height * scale
          );

          // 根據角落調整位置
          if (resizeType === 'nw-corner') {
            selectedImage.x =
              initialPositionRef.current.x +
              initialSizeRef.current.width -
              selectedImage.width;
            selectedImage.y =
              initialPositionRef.current.y +
              initialSizeRef.current.height -
              selectedImage.height;
          } else if (resizeType === 'ne-corner') {
            selectedImage.x = initialPositionRef.current.x;
            selectedImage.y =
              initialPositionRef.current.y +
              initialSizeRef.current.height -
              selectedImage.height;
          } else if (resizeType === 'sw-corner') {
            selectedImage.x =
              initialPositionRef.current.x +
              initialSizeRef.current.width -
              selectedImage.width;
            selectedImage.y = initialPositionRef.current.y;
          } else if (resizeType === 'se-corner') {
            selectedImage.x = initialPositionRef.current.x;
            selectedImage.y = initialPositionRef.current.y;
          }
        } else if (resizeType === 'e-edge') {
          // 右邊緣 - 只調整寬度
          selectedImage.width = Math.max(
            20,
            initialSizeRef.current.width + deltaX
          );
        } else if (resizeType === 'w-edge') {
          // 左邊緣 - 調整寬度和X位置
          const newWidth = Math.max(20, initialSizeRef.current.width - deltaX);
          selectedImage.x =
            initialPositionRef.current.x +
            (initialSizeRef.current.width - newWidth);
          selectedImage.width = newWidth;
        } else if (resizeType === 's-edge') {
          // 下邊緣 - 只調整高度
          selectedImage.height = Math.max(
            20,
            initialSizeRef.current.height + deltaY
          );
        } else if (resizeType === 'n-edge') {
          // 上邊緣 - 調整高度和Y位置
          const newHeight = Math.max(
            20,
            initialSizeRef.current.height - deltaY
          );
          selectedImage.y =
            initialPositionRef.current.y +
            (initialSizeRef.current.height - newHeight);
          selectedImage.height = newHeight;
        }

        // 重新繪製畫布
        redrawCanvas();
      }
    } else if (isDraggingRef.current && selectedImageRef.current) {
      // 拖拽模式
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        selectedImage.x = x - dragOffsetRef.current.x;
        selectedImage.y = y - dragOffsetRef.current.y;

        // 重新繪製畫布
        redrawCanvas();
      }
    } else {
      // 檢查鼠標是否在圖片上，改變游標樣式
      const hoveredImage = getClickedImage(x, y);

      if (hoveredImage) {
        // 如果圖片已被選中，檢查是否在縮放控制區域上
        if (selectedImageRef.current === hoveredImage.id) {
          const resizeHandle = getResizeHandle(x, y, hoveredImage);
          if (resizeHandle) {
            if (resizeHandle.includes('corner')) {
              canvas.style.cursor = 'nw-resize';
            } else if (
              resizeHandle.includes('e-edge') ||
              resizeHandle.includes('w-edge')
            ) {
              canvas.style.cursor = 'ew-resize';
            } else if (
              resizeHandle.includes('n-edge') ||
              resizeHandle.includes('s-edge')
            ) {
              canvas.style.cursor = 'ns-resize';
            }
          } else {
            canvas.style.cursor = 'grab';
          }
        } else {
          // 任何圖片都可以拖拽
          canvas.style.cursor = 'grab';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  // 處理鼠標鬆開事件
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    resizeTypeRef.current = null;
    const canvas = canvasRef.current;
    canvas.style.cursor = 'default';
  };

  // 刪除選中的圖片
  const deleteSelectedImage = useCallback(() => {
    if (selectedImageRef.current) {
      // 從圖片陣列中移除選中的圖片
      imagesRef.current = imagesRef.current.filter(
        (img) => img.id !== selectedImageRef.current
      );

      // 清除選取狀態
      selectedImageRef.current = null;

      // 重新繪製畫布
      redrawCanvas();
    }
  }, [redrawCanvas]);

  // 處理鍵盤事件
  const handleKeyDown = useCallback(
    (e) => {
      // Delete 鍵或 Backspace 鍵刪除選中的圖片
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); // 防止瀏覽器的預設行為
        deleteSelectedImage();
      }
    },
    [deleteSelectedImage]
  );

  // 添加鍵盤事件監聽器
  useEffect(() => {
    // 監聽鍵盤事件
    window.addEventListener('keydown', handleKeyDown);

    // 清理函數
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]); // 添加 handleKeyDown 作為依賴

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

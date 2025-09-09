/* eslint-disable no-unused-vars */
import { useEffect, useRef } from 'react';
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
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });

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

  // 檢測是否點擊到縮放控制點（圖片右下角的小方塊）
  const getResizeHandle = (x, y, image) => {
    if (!image) return false;

    const handleSize = 10; // 縮放控制點的大小
    const handleX = image.x + image.width - handleSize / 2;
    const handleY = image.y + image.height - handleSize / 2;

    return (
      x >= handleX &&
      x <= handleX + handleSize &&
      y >= handleY &&
      y <= handleY + handleSize
    );
  };

  // 重新繪製所有圖片和選擇框
  const redrawCanvas = () => {
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

            // 繪製縮放控制點（右下角的小方塊）
            const handleSize = 10;
            const handleX = imgData.x + imgData.width - handleSize / 2;
            const handleY = imgData.y + imgData.height - handleSize / 2;

            virtualContext.setLineDash([]); // 重置虛線
            virtualContext.fillStyle = '#ff0000';
            virtualContext.fillRect(handleX, handleY, handleSize, handleSize);
            virtualContext.strokeStyle = '#ffffff';
            virtualContext.lineWidth = 1;
            virtualContext.strokeRect(handleX, handleY, handleSize, handleSize);

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
  };

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

  // 處理點擊事件
  const handleClick = (e) => {
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

    // 檢查是否點擊到圖片
    const clickedImage = getClickedImage(x, y);

    if (clickedImage) {
      selectedImageRef.current = clickedImage.id;
    } else {
      selectedImageRef.current = null;
    }

    // 重新繪製畫布
    redrawCanvas();
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

    // 檢查是否點擊到選中的圖片
    const clickedImage = getClickedImage(x, y);

    if (clickedImage && selectedImageRef.current === clickedImage.id) {
      // 檢查是否點擊到縮放控制點
      if (getResizeHandle(x, y, clickedImage)) {
        isResizingRef.current = true;
        initialSizeRef.current = {
          width: clickedImage.width,
          height: clickedImage.height,
        };
        initialMouseRef.current = { x, y };
        canvas.style.cursor = 'nw-resize';
      } else {
        // 普通拖拽
        isDraggingRef.current = true;
        dragOffsetRef.current = {
          x: x - clickedImage.x,
          y: y - clickedImage.y,
        };
        canvas.style.cursor = 'grabbing';
      }
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
      // 縮放模式 - 讓右下角控制點跟隨滑鼠移動
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        // 計算圖片左上角位置（固定不變）
        const topLeftX = selectedImage.x;
        const topLeftY = selectedImage.y;

        // 滑鼠現在的位置就是新的右下角位置
        const newBottomRightX = x;
        const newBottomRightY = y;

        // 計算新的寬度和高度
        const newWidth = Math.max(20, newBottomRightX - topLeftX); // 最小寬度20px
        const newHeight = Math.max(20, newBottomRightY - topLeftY); // 最小高度20px

        // 保持圖片的長寬比例
        const aspectRatio =
          initialSizeRef.current.width / initialSizeRef.current.height;

        // 根據寬度或高度的變化比例來決定最終尺寸
        const widthScale = newWidth / initialSizeRef.current.width;
        const heightScale = newHeight / initialSizeRef.current.height;

        // 選擇較小的縮放比例以保持長寬比
        const scale = Math.min(widthScale, heightScale);

        // 應用縮放比例
        selectedImage.width = initialSizeRef.current.width * scale;
        selectedImage.height = initialSizeRef.current.height * scale;

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

      if (hoveredImage && selectedImageRef.current === hoveredImage.id) {
        // 檢查是否在縮放控制點上
        if (getResizeHandle(x, y, hoveredImage)) {
          canvas.style.cursor = 'nw-resize';
        } else {
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
    const canvas = canvasRef.current;
    canvas.style.cursor = 'default';
  };
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

/* eslint-disable no-unused-vars */
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import useCanvas from './hooks/useCanvas';
import {
  createVirtualCanvasBg,
  updateVisibleCanvas,
} from './helper/canvasHelper';
import { virtualCanvasSize } from './constant/size';
import { preventDefaults } from './helper/commonHelper';
import ImageControlPanel from './components/ImageControlPanel';
import EyedropperCursor from './components/EyedropperCursor';
import Toolbar from './components/Toolbar';

const dragDropEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];

export const Canvas = () => {
  // 主畫布、虛擬畫布的主體和 2D context
  const { canvasRef, contextRef, virtualCanvasRef, virtualContextRef } =
    useCanvas();

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

  // 性能優化相關的 ref
  const animationFrameRef = useRef(null);
  const needsRedraw = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const throttleTimer = useRef(null);

  // 拖拽狀態
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 縮放狀態
  const isResizingRef = useRef(false);
  const resizeTypeRef = useRef(null); // 儲存縮放類型
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });
  const initialPositionRef = useRef({ x: 0, y: 0 }); // 儲存初始位置

  // 吸管工具狀態
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [eyedropperColor, setEyedropperColor] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [previewColor, setPreviewColor] = useState(null);

  // 處理吸管工具游標狀態
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isEyedropperActive ? 'crosshair' : 'default';
    }
  }, [isEyedropperActive, canvasRef]);

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

  // 將圖片繪製到虛擬畫布的函數
  const drawImageToVirtualCanvas = useCallback(
    (img, imgData, virtualContext) => {
      virtualContext.save();

      // 設定變換的中心點為圖片的中心
      const centerX = imgData.x + imgData.width / 2;
      const centerY = imgData.y + imgData.height / 2;

      // 移動到圖片中心
      virtualContext.translate(centerX, centerY);

      // 處理翻轉
      let scaleX = imgData.flipH ? -1 : 1;
      let scaleY = imgData.flipV ? -1 : 1;
      virtualContext.scale(scaleX, scaleY);

      // 設定不透明度
      virtualContext.globalAlpha = imgData.opacity || 1;

      // 應用圖片效果
      switch (imgData.effect) {
        case 'grayscale':
          virtualContext.filter = 'grayscale(100%)';
          break;
        case 'sepia':
          virtualContext.filter = 'sepia(100%)';
          break;
        case 'blur':
          virtualContext.filter = 'blur(2px)';
          break;
        case 'brightness':
          virtualContext.filter = 'brightness(1.5)';
          break;
        case 'contrast':
          virtualContext.filter = 'contrast(1.5)';
          break;
        case 'saturate':
          virtualContext.filter = 'saturate(1.8)';
          break;
        case 'hue-rotate':
          virtualContext.filter = 'hue-rotate(90deg)';
          break;
        default:
          virtualContext.filter = 'none';
          break;
      }

      // 繪製圖片（以中心為原點）
      virtualContext.drawImage(
        img,
        -imgData.width / 2,
        -imgData.height / 2,
        imgData.width,
        imgData.height
      );

      virtualContext.restore();

      // 如果是選中的圖片，繪製虛線框和縮放控制點
      if (selectedImageRef.current === imgData.id) {
        virtualContext.save();

        // 繪製虛線框
        virtualContext.strokeStyle = imgData.pinned ? '#ffa500' : '#ff0000'; // 固定的圖片用橙色框
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

        // 如果圖片被固定，在右上角繪製 pin 圖示
        if (imgData.pinned) {
          virtualContext.save();
          virtualContext.fillStyle = '#ffa500';
          virtualContext.strokeStyle = '#fff';
          virtualContext.lineWidth = 2;

          const pinX = imgData.x + imgData.width - 20;
          const pinY = imgData.y + 5;
          const pinSize = 12;

          // 繪製 pin 圖示背景圓圈
          virtualContext.beginPath();
          virtualContext.arc(pinX, pinY, pinSize / 2 + 2, 0, Math.PI * 2);
          virtualContext.fill();
          virtualContext.stroke();

          // 繪製 pin 圖示
          virtualContext.fillStyle = '#fff';
          virtualContext.font = 'bold 10px Arial';
          virtualContext.textAlign = 'center';
          virtualContext.textBaseline = 'middle';
          virtualContext.fillText('📌', pinX, pinY);

          virtualContext.restore();
        }

        virtualContext.restore();
      }
    },
    []
  );

  // 立即重繪函數（內部使用）
  const redrawCanvasImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const virtualContext = virtualContextRef.current;

    if (!canvas || !canvasContext || !virtualCanvas || !virtualContext) return;

    // 清空虛擬畫布並重繪背景
    virtualContext.clearRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    createVirtualCanvasBg({ context: virtualContext });

    // 同步繪製所有已緩存的圖片，避免 Promise.all 等待
    let pendingImages = 0;
    let completedImages = 0;

    const checkComplete = () => {
      completedImages++;
      if (completedImages === imagesRef.current.length) {
        updateVisibleCanvas({
          canvas,
          canvasContext,
          virtualCanvas,
        });
      }
    };

    imagesRef.current.forEach((imgData) => {
      if (imageObjectsRef.current.has(imgData.id)) {
        // 直接使用緩存的圖片對象進行繪製
        const img = imageObjectsRef.current.get(imgData.id);
        drawImageToVirtualCanvas(img, imgData, virtualContext);
        checkComplete();
      } else {
        // 如果沒有緩存，則載入新圖片
        pendingImages++;
        const img = new Image();
        img.onload = () => {
          // 將載入的圖片對象存入緩存
          imageObjectsRef.current.set(imgData.id, img);
          drawImageToVirtualCanvas(img, imgData, virtualContext);
          checkComplete();
        };
        img.src = imgData.src;
      }
    });

    // 如果所有圖片都已緩存，立即更新畫布
    if (pendingImages === 0) {
      updateVisibleCanvas({
        canvas,
        canvasContext,
        virtualCanvas,
      });
    }
  }, [
    canvasRef,
    contextRef,
    virtualCanvasRef,
    virtualContextRef,
    drawImageToVirtualCanvas,
  ]);

  // 優化的重繪函數 - 使用 RAF 來避免過度重繪
  const scheduleRedraw = useCallback(() => {
    if (needsRedraw.current) return; // 如果已經安排重繪，就不要重複安排

    needsRedraw.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      redrawCanvasImmediate();
      needsRedraw.current = false;
      animationFrameRef.current = null;
    });
  }, [redrawCanvasImmediate]);

  // 重新繪製所有圖片和選擇框（對外接口）
  const redrawCanvas = useCallback(() => {
    scheduleRedraw();
  }, [scheduleRedraw]);

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
            flipH: false, // 水平翻轉狀態
            flipV: false, // 垂直翻轉狀態
            opacity: 1, // 不透明度（0-1）
            pinned: false, // 是否固定位置
            effect: null, // 圖片效果 ('grayscale', 'sepia', 'blur', 'brightness', 'contrast', 'saturate', 'hue-rotate' 等)
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

  // 吸管工具功能
  const toggleEyedropper = () => {
    const newState = !isEyedropperActive;
    setIsEyedropperActive(newState);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = newState ? 'crosshair' : 'default';
    }

    // 關閉吸管工具時清除預覽顏色
    if (!newState) {
      setPreviewColor(null);
    }
  };

  // 節流版本的取色函數
  const getColorAtPositionThrottled = useCallback(
    (x, y) => {
      // 檢查位置是否變化足夠大，避免頻繁取色
      const deltaX = Math.abs(x - lastMousePosition.current.x);
      const deltaY = Math.abs(y - lastMousePosition.current.y);

      if (deltaX < 2 && deltaY < 2) {
        return previewColor; // 返回上次的顏色
      }

      lastMousePosition.current = { x, y };

      const canvas = canvasRef.current;
      const context = contextRef.current;

      if (!canvas || !context) return null;

      try {
        // 取得該像素的 RGBA 資料
        const imageData = context.getImageData(x, y, 1, 1);
        const data = imageData.data;

        // 轉換為十六進制格式
        const r = data[0];
        const g = data[1];
        const b = data[2];
        const a = data[3];

        // 如果透明度為 0，嘗試從虛擬畫布取色
        if (a === 0) {
          // 如果主畫布該位置透明，嘗試從虛擬畫布取色（背景）
          const virtualCanvas = virtualCanvasRef.current;
          const virtualContext = virtualContextRef.current;

          if (virtualCanvas && virtualContext) {
            try {
              const virtualImageData = virtualContext.getImageData(x, y, 1, 1);
              const virtualData = virtualImageData.data;
              const vr = virtualData[0];
              const vg = virtualData[1];
              const vb = virtualData[2];
              const va = virtualData[3];

              if (va > 0) {
                const virtualHex =
                  '#' +
                  [vr, vg, vb]
                    .map((x) => {
                      const hex = x.toString(16);
                      return hex.length === 1 ? '0' + hex : hex;
                    })
                    .join('');
                return virtualHex;
              }
            } catch (virtualError) {
              console.log('無法從虛擬畫布取色:', virtualError);
            }
          }
          return 'transparent';
        }

        // 轉換為十六進制
        const hex =
          '#' +
          [r, g, b]
            .map((x) => {
              const hex = x.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');

        return hex;
      } catch (error) {
        console.error('無法取得顏色資料:', error);
        return null;
      }
    },
    [previewColor, canvasRef, contextRef, virtualCanvasRef, virtualContextRef]
  );

  // 從畫布取得指定位置的顏色（保持向後兼容）
  const getColorAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!canvas || !context) return null;

    try {
      // 取得該像素的 RGBA 資料
      const imageData = context.getImageData(x, y, 1, 1);
      const data = imageData.data;

      // 轉換為十六進制格式
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const a = data[3];

      // 如果透明度為 0，嘗試從虛擬畫布取色
      if (a === 0) {
        // 如果主畫布該位置透明，嘗試從虛擬畫布取色（背景）
        const virtualCanvas = virtualCanvasRef.current;
        const virtualContext = virtualContextRef.current;

        if (virtualCanvas && virtualContext) {
          try {
            const virtualImageData = virtualContext.getImageData(x, y, 1, 1);
            const virtualData = virtualImageData.data;
            const vr = virtualData[0];
            const vg = virtualData[1];
            const vb = virtualData[2];
            const va = virtualData[3];

            if (va > 0) {
              const virtualHex =
                '#' +
                [vr, vg, vb]
                  .map((x) => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                  })
                  .join('');
              return virtualHex;
            }
          } catch (virtualError) {
            console.log('無法從虛擬畫布取色:', virtualError);
          }
        }
        return 'transparent';
      }

      // 轉換為十六進制
      const hex =
        '#' +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('');

      return hex;
    } catch (error) {
      console.error('無法取得顏色資料:', error);
      return null;
    }
  };

  // 處理鼠標按下事件
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 計算點擊位置相對於畫布的座標
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 如果吸管工具啟用，執行取色功能
    if (isEyedropperActive) {
      const color = getColorAtPosition(x, y);
      if (color && color !== 'transparent') {
        setEyedropperColor(color);
        console.log('取得顏色:', color);
      }
      // 取色後自動關閉吸管工具
      setIsEyedropperActive(false);
      canvas.style.cursor = 'default';
      return; // 結束函數，不執行其他點擊邏輯
    }

    // 計算點擊位置相對於虛擬畫布的座標（用於圖片操作）
    const virtualX =
      e.clientX -
      rect.left +
      (window.scrollX || document.documentElement.scrollLeft);
    const virtualY =
      e.clientY -
      rect.top +
      (window.scrollY || document.documentElement.scrollTop);

    // 檢查是否點擊到任何圖片
    const clickedImage = getClickedImage(virtualX, virtualY);

    if (clickedImage) {
      // 自動選中點擊的圖片
      selectedImageRef.current = clickedImage.id;
      setSelectedImageId(clickedImage.id);

      // 檢查是否點擊到縮放控制區域
      const resizeHandle = getResizeHandle(virtualX, virtualY, clickedImage);
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
        initialMouseRef.current = { x: virtualX, y: virtualY };

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
      } else if (!clickedImage.pinned) {
        // 只有在圖片沒有被固定時才允許拖拽
        isDraggingRef.current = true;
        dragOffsetRef.current = {
          x: virtualX - clickedImage.x,
          y: virtualY - clickedImage.y,
        };
        canvas.style.cursor = 'grabbing';
      } else {
        // 圖片被固定，顯示禁止游標
        canvas.style.cursor = 'not-allowed';
      }

      // 重新繪製畫布以顯示選取框
      redrawCanvas();
    } else {
      // 點擊空白處，取消選取
      selectedImageRef.current = null;
      setSelectedImageId(null);
      redrawCanvas();
    }
  };

  // 處理鼠標移動事件
  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // 計算畫布上的鼠標位置
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // 如果吸管工具啟用，更新鼠標位置和預覽顏色
      if (isEyedropperActive) {
        setMousePosition({ x: canvasX, y: canvasY });

        // 使用節流版本的取色函數
        if (throttleTimer.current) {
          clearTimeout(throttleTimer.current);
        }

        throttleTimer.current = setTimeout(() => {
          const currentColor = getColorAtPositionThrottled(canvasX, canvasY);
          if (currentColor !== previewColor) {
            setPreviewColor(currentColor);
          }
        }, 16); // ~60fps
      }

      // 計算滑鼠位置（用於圖片操作）
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
            const newWidth = Math.max(
              20,
              initialSizeRef.current.width - deltaX
            );
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
    },
    [
      canvasRef,
      isEyedropperActive,
      getColorAtPositionThrottled,
      previewColor,
      selectedImageRef,
      redrawCanvas,
    ]
  );

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
      // 從緩存中移除圖片對象
      imageObjectsRef.current.delete(selectedImageRef.current);

      // 從圖片陣列中移除選中的圖片
      imagesRef.current = imagesRef.current.filter(
        (img) => img.id !== selectedImageRef.current
      );

      // 清除選取狀態
      selectedImageRef.current = null;
      setSelectedImageId(null);

      // 重新繪製畫布
      redrawCanvas();
    }
  }, [redrawCanvas]);

  // 水平翻轉選中的圖片
  const flipSelectedImageHorizontal = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        selectedImage.flipH = !selectedImage.flipH;
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  // 垂直翻轉選中的圖片
  const flipSelectedImageVertical = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        selectedImage.flipV = !selectedImage.flipV;
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  // 複製選中的圖片
  const duplicateSelectedImage = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        const newImage = {
          ...selectedImage,
          id: Date.now(), // 使用時間戳作為新 ID
          x: selectedImage.x + 20, // 稍微偏移位置
          y: selectedImage.y + 20,
        };
        imagesRef.current.push(newImage);
        selectedImageRef.current = newImage.id; // 選中新複製的圖片
        setSelectedImageId(newImage.id);
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  // 將選中的圖片向前移動一層
  const bringToFront = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedIndex = imagesRef.current.findIndex(
        (img) => img.id === selectedImageRef.current
      );
      if (
        selectedIndex !== -1 &&
        selectedIndex < imagesRef.current.length - 1
      ) {
        // 與下一個圖片交換位置（向前移動一層）
        const temp = imagesRef.current[selectedIndex];
        imagesRef.current[selectedIndex] = imagesRef.current[selectedIndex + 1];
        imagesRef.current[selectedIndex + 1] = temp;
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  // 將選中的圖片向後移動一層
  const sendToBack = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedIndex = imagesRef.current.findIndex(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedIndex !== -1 && selectedIndex > 0) {
        // 與前一個圖片交換位置（向後移動一層）
        const temp = imagesRef.current[selectedIndex];
        imagesRef.current[selectedIndex] = imagesRef.current[selectedIndex - 1];
        imagesRef.current[selectedIndex - 1] = temp;
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  // 調整選中圖片的不透明度
  const changeSelectedImageOpacity = useCallback(
    (opacity) => {
      if (selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          selectedImage.opacity = Math.max(0, Math.min(1, opacity)); // 確保值在 0-1 之間
          redrawCanvas();
          // 觸發重新渲染以更新 UI
          setForceUpdate((prev) => prev + 1);
        }
      }
    },
    [redrawCanvas]
  );

  // 切換選中圖片的固定狀態
  const toggleSelectedImagePin = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        selectedImage.pinned = !selectedImage.pinned;
        // 立即重繪畫布以顯示視覺變化
        redrawCanvas();
        // 觸發重新渲染以更新 UI
        setForceUpdate((prev) => prev + 1);
      }
    }
  }, [redrawCanvas]);

  // 切換選中圖片的效果
  const changeSelectedImageEffect = useCallback(
    (effectName) => {
      if (selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          // 如果已經有相同效果，則移除；否則設定新效果
          selectedImage.effect =
            selectedImage.effect === effectName ? null : effectName;
          // 立即重繪畫布以顯示效果
          redrawCanvas();
          // 觸發重新渲染以更新 UI
          setForceUpdate((prev) => prev + 1);
        }
      }
    },
    [redrawCanvas]
  );

  // 從剪貼簿處理圖片貼上
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      // 檢查剪貼簿 API 是否可用
      if (!navigator.clipboard || !navigator.clipboard.read) {
        console.warn('剪貼簿 API 不可用');
        return;
      }

      // 讀取剪貼簿內容
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        // 查找圖片類型的項目
        const imageTypes = clipboardItem.types.filter((type) =>
          type.startsWith('image/')
        );

        if (imageTypes.length > 0) {
          // 獲取第一個圖片類型
          const imageType = imageTypes[0];
          const blob = await clipboardItem.getType(imageType);

          // 將 blob 轉換為 data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = canvasRef.current;
              if (!canvas) return;

              // 計算圖片置中要放的位置
              const widthCenter = canvas.width / 2 - img.width / 2;
              const heightCenter = canvas.height / 2 - img.height / 2;

              // 將圖片資訊存入 ref
              const newImage = {
                id: crypto.randomUUID(),
                src: e.target.result,
                x: widthCenter,
                y: heightCenter,
                width: img.width,
                height: img.height,
                flipH: false, // 水平翻轉狀態
                flipV: false, // 垂直翻轉狀態
                opacity: 1, // 不透明度（0-1）
                pinned: false, // 是否固定位置
                effect: null, // 圖片效果 ('grayscale', 'sepia', 'blur', 'brightness', 'contrast', 'saturate', 'hue-rotate' 等)
              };

              imagesRef.current.push(newImage);

              // 自動選中新加入的圖片
              selectedImageRef.current = newImage.id;
              setSelectedImageId(newImage.id);

              // 重新繪製畫布
              redrawCanvas();
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);

          // 找到第一個圖片就停止
          break;
        }
      }
    } catch (err) {
      console.error('無法從剪貼簿讀取圖片:', err);

      // 如果新 API 不可用，嘗試使用舊的 paste 事件方式
      // 這裡我們可以顯示一個提示給用戶
      console.info('提示：請嘗試直接在頁面上按 Ctrl+V 來貼上圖片');
    }
  }, [redrawCanvas, canvasRef]);

  // 處理傳統的 paste 事件（作為備用方案）
  const handlePasteEvent = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // 檢查是否為圖片
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                // 計算圖片置中要放的位置
                const widthCenter = canvas.width / 2 - img.width / 2;
                const heightCenter = canvas.height / 2 - img.height / 2;

                // 將圖片資訊存入 ref
                const newImage = {
                  id: crypto.randomUUID(),
                  src: e.target.result,
                  x: widthCenter,
                  y: heightCenter,
                  width: img.width,
                  height: img.height,
                  flipH: false, // 水平翻轉狀態
                  flipV: false, // 垂直翻轉狀態
                  opacity: 1, // 不透明度（0-1）
                  pinned: false, // 是否固定位置
                  effect: null, // 圖片效果 ('grayscale', 'sepia', 'blur', 'brightness', 'contrast', 'saturate', 'hue-rotate' 等)
                };

                imagesRef.current.push(newImage);

                // 自動選中新加入的圖片
                selectedImageRef.current = newImage.id;
                setSelectedImageId(newImage.id);

                // 重新繪製畫布
                redrawCanvas();
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    },
    [redrawCanvas, canvasRef]
  );

  // 處理鍵盤事件
  const handleKeyDown = useCallback(
    (e) => {
      // Delete 鍵或 Backspace 鍵刪除選中的圖片
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); // 防止瀏覽器的預設行為
        deleteSelectedImage();
      }

      // Cmd+V (macOS) 或 Ctrl+V (Windows/Linux) 貼上圖片
      if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handlePasteFromClipboard();
      }

      // Shift + H 水平翻轉
      if (e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        flipSelectedImageHorizontal();
      }

      // Shift + V 垂直翻轉
      if (e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        flipSelectedImageVertical();
      }
    },
    [
      deleteSelectedImage,
      flipSelectedImageHorizontal,
      flipSelectedImageVertical,
      handlePasteFromClipboard,
    ]
  );

  // 添加鍵盤事件和剪貼簿事件監聽器
  useEffect(() => {
    // 監聽鍵盤事件
    window.addEventListener('keydown', handleKeyDown);

    // 監聽剪貼簿貼上事件（作為備用方案）
    window.addEventListener('paste', handlePasteEvent);

    // 清理函數
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, [handleKeyDown, handlePasteEvent]); // 添加依賴

  // 獲取選中的圖片對象
  const selectedImage = useMemo(() => {
    if (!selectedImageId) return null;
    return imagesRef.current.find((img) => img.id === selectedImageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageId, forceUpdate]);

  // 清理函數 - 清理定時器和動畫幀
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, []);

  return (
    <>
      <Toolbar
        onEyedropperToggle={toggleEyedropper}
        isEyedropperActive={isEyedropperActive}
        eyedropperColor={eyedropperColor}
      />
      <ImageControlPanel
        selectedImage={selectedImage}
        onFlipHorizontal={flipSelectedImageHorizontal}
        onFlipVertical={flipSelectedImageVertical}
        onDelete={deleteSelectedImage}
        onDuplicate={duplicateSelectedImage}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onOpacityChange={changeSelectedImageOpacity}
        onTogglePin={toggleSelectedImagePin}
        onEffectChange={changeSelectedImageEffect}
      />
      <EyedropperCursor
        x={mousePosition.x}
        y={mousePosition.y}
        isActive={isEyedropperActive}
        previewColor={previewColor}
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
};

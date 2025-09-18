/* eslint-disable no-unused-vars */
import { useEffect, useRef, useCallback, useMemo } from 'react';
import useCanvas from './hooks/useCanvas';
import { useImageManager } from './hooks/useImageManager';
import { useEyedropper } from './hooks/useEyedropper';
import { useInteractionStates } from './hooks/useInteractionStates';
import {
  createVirtualCanvasBg,
  updateVisibleCanvas,
} from './helper/canvasHelper';
import { virtualCanvasSize } from './constant/size';
import { preventDefaults } from './helper/commonHelper';
import {
  getClickedImage,
  getResizeHandle,
  imageTransforms,
} from './utils/imageOperations';
import {
  getColorAtPosition,
  createThrottledColorPicker,
} from './utils/colorPicker';
import {
  createDropHandler,
  createPasteHandler,
  createPasteEventHandler,
} from './utils/fileHandlers';
import { drawImageToVirtualCanvas } from './utils/canvasRenderer';
import ImageControlPanel from './components/ImageControlPanel';
import EyedropperCursor from './components/EyedropperCursor';
import Toolbar from './components/Toolbar';

const dragDropEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];

export const Canvas = () => {
  // 使用自定義 hooks 來管理狀態
  const { canvasRef, contextRef, virtualCanvasRef, virtualContextRef } =
    useCanvas();
  const imageManager = useImageManager();
  const eyedropper = useEyedropper();
  const interactionStates = useInteractionStates();

  // 解構所需的狀態和方法
  const {
    imagesRef,
    imageObjectsRef,
    selectedImageRef,
    selectedImageId,
    forceUpdate,
    selectImage,
    deselectImage,
    deleteSelectedImage,
    forceUpdateImages,
  } = imageManager;

  const {
    isEyedropperActive,
    eyedropperColor,
    mousePosition,
    previewColor,
    setEyedropperColor,
    setMousePosition,
    setPreviewColor,
    toggleEyedropper,
  } = eyedropper;

  const {
    animationFrameRef,
    needsRedraw,
    lastMousePosition,
    throttleTimer,
    isDraggingRef,
    dragOffsetRef,
    isResizingRef,
    resizeTypeRef,
    initialSizeRef,
    initialMouseRef,
    initialPositionRef,
  } = interactionStates;

  // 處理畫布游標狀態
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isEyedropperActive ? 'crosshair' : 'default';
    }
  }, [isEyedropperActive, canvasRef]);

  // 初始化畫布
  useEffect(() => {
    const virtualCanvas = virtualCanvasRef.current;
    virtualCanvas.width = virtualCanvasSize.width;
    virtualCanvas.height = virtualCanvasSize.height;

    virtualContextRef.current = virtualCanvas.getContext('2d');
    createVirtualCanvasBg({ context: virtualContextRef.current });

    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext('2d');

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

  // 立即重繪函數
  const redrawCanvasImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    const canvasContext = contextRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const virtualContext = virtualContextRef.current;

    if (!canvas || !canvasContext || !virtualCanvas || !virtualContext) return;

    // 清空虛擬畫布並重繪背景
    virtualContext.clearRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    createVirtualCanvasBg({ context: virtualContext });

    // 繪製所有圖片
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
        const img = imageObjectsRef.current.get(imgData.id);
        const isSelected = selectedImageRef.current === imgData.id;
        drawImageToVirtualCanvas(img, imgData, virtualContext, isSelected);
        checkComplete();
      } else {
        pendingImages++;
        const img = new Image();
        img.onload = () => {
          imageObjectsRef.current.set(imgData.id, img);
          const isSelected = selectedImageRef.current === imgData.id;
          drawImageToVirtualCanvas(img, imgData, virtualContext, isSelected);
          checkComplete();
        };
        img.src = imgData.src;
      }
    });

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
    imagesRef,
    imageObjectsRef,
    selectedImageRef,
  ]);

  // 優化的重繪函數
  const scheduleRedraw = useCallback(() => {
    if (needsRedraw.current) return;

    needsRedraw.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      redrawCanvasImmediate();
      needsRedraw.current = false;
      animationFrameRef.current = null;
    });
  }, [redrawCanvasImmediate, needsRedraw, animationFrameRef]);

  const redrawCanvas = useCallback(() => {
    scheduleRedraw();
  }, [scheduleRedraw]);

  // 處理圖片添加
  const handleImageAdded = useCallback(
    (imageData, autoSelect = false) => {
      if (autoSelect) {
        selectImage(imageData.id);
      }
      redrawCanvas();
    },
    [selectImage, redrawCanvas]
  );

  // 設置拖放事件處理
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleDrop = createDropHandler(canvas, imagesRef, handleImageAdded);

    dragDropEvents.forEach((e) => {
      canvas.addEventListener(e, preventDefaults);
    });
    canvas.addEventListener('drop', handleDrop);

    return () => {
      dragDropEvents.forEach((e) => {
        canvas.removeEventListener(e, preventDefaults);
      });
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [canvasRef, imagesRef, handleImageAdded]);

  // 創建節流版本的取色函數
  const getColorAtPositionThrottled = useCallback(
    (x, y) => {
      const throttledPicker = createThrottledColorPicker((x, y) =>
        getColorAtPosition(x, y, contextRef.current, virtualContextRef.current)
      );
      return throttledPicker(x, y);
    },
    [contextRef, virtualContextRef]
  );

  // 處理縮放邏輯
  const handleImageResize = useCallback(
    (x, y, selectedImage) => {
      const deltaX = x - initialMouseRef.current.x;
      const deltaY = y - initialMouseRef.current.y;
      const resizeType = resizeTypeRef.current;

      if (resizeType.includes('corner')) {
        // 角落縮放 - 等比例縮放
        let newWidth, newHeight;

        if (resizeType === 'se-corner') {
          newWidth = Math.max(20, x - initialPositionRef.current.x);
          newHeight = Math.max(20, y - initialPositionRef.current.y);
        } else if (resizeType === 'nw-corner') {
          newWidth = Math.max(
            20,
            initialPositionRef.current.x + initialSizeRef.current.width - x
          );
          newHeight = Math.max(
            20,
            initialPositionRef.current.y + initialSizeRef.current.height - y
          );
        } else if (resizeType === 'ne-corner') {
          newWidth = Math.max(20, x - initialPositionRef.current.x);
          newHeight = Math.max(
            20,
            initialPositionRef.current.y + initialSizeRef.current.height - y
          );
        } else if (resizeType === 'sw-corner') {
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
        selectedImage.width = Math.max(
          20,
          initialSizeRef.current.width + deltaX
        );
      } else if (resizeType === 'w-edge') {
        const newWidth = Math.max(20, initialSizeRef.current.width - deltaX);
        selectedImage.x =
          initialPositionRef.current.x +
          (initialSizeRef.current.width - newWidth);
        selectedImage.width = newWidth;
      } else if (resizeType === 's-edge') {
        selectedImage.height = Math.max(
          20,
          initialSizeRef.current.height + deltaY
        );
      } else if (resizeType === 'n-edge') {
        const newHeight = Math.max(20, initialSizeRef.current.height - deltaY);
        selectedImage.y =
          initialPositionRef.current.y +
          (initialSizeRef.current.height - newHeight);
        selectedImage.height = newHeight;
      }
    },
    [initialMouseRef, initialPositionRef, initialSizeRef, resizeTypeRef]
  );

  // 處理鼠標按下事件
  const handleMouseDown = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 吸管工具邏輯
      if (isEyedropperActive) {
        const color = getColorAtPosition(
          x,
          y,
          contextRef.current,
          virtualContextRef.current
        );
        if (color && color !== 'transparent') {
          setEyedropperColor(color);
          console.log('取得顏色:', color);
        }
        toggleEyedropper();
        return;
      }

      // 圖片操作邏輯
      const virtualX =
        e.clientX -
        rect.left +
        (window.scrollX || document.documentElement.scrollLeft);
      const virtualY =
        e.clientY -
        rect.top +
        (window.scrollY || document.documentElement.scrollTop);

      const clickedImage = getClickedImage(
        virtualX,
        virtualY,
        imagesRef.current
      );

      if (clickedImage) {
        selectImage(clickedImage.id);

        const resizeHandle = getResizeHandle(virtualX, virtualY, clickedImage);
        if (resizeHandle) {
          isResizingRef.current = true;
          resizeTypeRef.current = resizeHandle;
          initialSizeRef.current = {
            width: clickedImage.width,
            height: clickedImage.height,
          };
          initialPositionRef.current = { x: clickedImage.x, y: clickedImage.y };
          initialMouseRef.current = { x: virtualX, y: virtualY };

          // 設定游標
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
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: virtualX - clickedImage.x,
            y: virtualY - clickedImage.y,
          };
          canvas.style.cursor = 'grabbing';
        } else {
          canvas.style.cursor = 'not-allowed';
        }

        redrawCanvas();
      } else {
        deselectImage();
        redrawCanvas();
      }
    },
    [
      canvasRef,
      contextRef,
      virtualContextRef,
      isEyedropperActive,
      setEyedropperColor,
      toggleEyedropper,
      imagesRef,
      selectImage,
      deselectImage,
      redrawCanvas,
      isResizingRef,
      resizeTypeRef,
      initialSizeRef,
      initialPositionRef,
      initialMouseRef,
      isDraggingRef,
      dragOffsetRef,
    ]
  );

  // 處理鼠標移動事件
  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // 吸管工具邏輯
      if (isEyedropperActive) {
        setMousePosition({ x: canvasX, y: canvasY });

        if (throttleTimer.current) {
          clearTimeout(throttleTimer.current);
        }

        throttleTimer.current = setTimeout(() => {
          const currentColor = getColorAtPositionThrottled(canvasX, canvasY);
          if (currentColor !== previewColor) {
            setPreviewColor(currentColor);
          }
        }, 16);
        return;
      }

      // 圖片拖拽和縮放邏輯
      const x =
        e.clientX -
        rect.left +
        (window.scrollX || document.documentElement.scrollLeft);
      const y =
        e.clientY -
        rect.top +
        (window.scrollY || document.documentElement.scrollTop);

      if (isResizingRef.current && selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          handleImageResize(x, y, selectedImage);
          redrawCanvas();
        }
      } else if (isDraggingRef.current && selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          selectedImage.x = x - dragOffsetRef.current.x;
          selectedImage.y = y - dragOffsetRef.current.y;
          redrawCanvas();
        }
      } else {
        // 檢查鼠標是否在圖片上，改變游標樣式
        const hoveredImage = getClickedImage(x, y, imagesRef.current);

        if (hoveredImage) {
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
            canvas.style.cursor = 'grab';
          }
        } else {
          canvas.style.cursor = isEyedropperActive ? 'crosshair' : 'default';
        }
      }
    },
    [
      canvasRef,
      isEyedropperActive,
      setMousePosition,
      throttleTimer,
      getColorAtPositionThrottled,
      previewColor,
      setPreviewColor,
      isResizingRef,
      selectedImageRef,
      imagesRef,
      handleImageResize,
      redrawCanvas,
      isDraggingRef,
      dragOffsetRef,
    ]
  );

  // 處理鼠標鬆開事件
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    resizeTypeRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isEyedropperActive ? 'crosshair' : 'default';
    }
  }, [
    isDraggingRef,
    isResizingRef,
    resizeTypeRef,
    canvasRef,
    isEyedropperActive,
  ]);

  // 圖片操作回調函數
  const flipSelectedImageHorizontal = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        imageTransforms.flipHorizontal(selectedImage);
        redrawCanvas();
      }
    }
  }, [selectedImageRef, imagesRef, redrawCanvas]);

  const flipSelectedImageVertical = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        imageTransforms.flipVertical(selectedImage);
        redrawCanvas();
      }
    }
  }, [selectedImageRef, imagesRef, redrawCanvas]);

  const duplicateSelectedImage = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        const newImage = imageTransforms.duplicate(selectedImage);
        imagesRef.current.push(newImage);
        selectImage(newImage.id);
        redrawCanvas();
      }
    }
  }, [selectedImageRef, imagesRef, selectImage, redrawCanvas]);

  const changeSelectedImageOpacity = useCallback(
    (opacity) => {
      if (selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          imageTransforms.setOpacity(selectedImage, opacity);
          redrawCanvas();
          forceUpdateImages();
        }
      }
    },
    [selectedImageRef, imagesRef, redrawCanvas, forceUpdateImages]
  );

  const toggleSelectedImagePin = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedImage = imagesRef.current.find(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedImage) {
        imageTransforms.togglePin(selectedImage);
        redrawCanvas();
        forceUpdateImages();
      }
    }
  }, [selectedImageRef, imagesRef, redrawCanvas, forceUpdateImages]);

  const changeSelectedImageEffect = useCallback(
    (effectName) => {
      if (selectedImageRef.current) {
        const selectedImage = imagesRef.current.find(
          (img) => img.id === selectedImageRef.current
        );
        if (selectedImage) {
          imageTransforms.setEffect(selectedImage, effectName);
          redrawCanvas();
          forceUpdateImages();
        }
      }
    },
    [selectedImageRef, imagesRef, redrawCanvas, forceUpdateImages]
  );

  // 層級操作
  const bringToFront = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedIndex = imagesRef.current.findIndex(
        (img) => img.id === selectedImageRef.current
      );
      if (
        selectedIndex !== -1 &&
        selectedIndex < imagesRef.current.length - 1
      ) {
        const temp = imagesRef.current[selectedIndex];
        imagesRef.current[selectedIndex] = imagesRef.current[selectedIndex + 1];
        imagesRef.current[selectedIndex + 1] = temp;
        redrawCanvas();
      }
    }
  }, [selectedImageRef, imagesRef, redrawCanvas]);

  const sendToBack = useCallback(() => {
    if (selectedImageRef.current) {
      const selectedIndex = imagesRef.current.findIndex(
        (img) => img.id === selectedImageRef.current
      );
      if (selectedIndex !== -1 && selectedIndex > 0) {
        const temp = imagesRef.current[selectedIndex];
        imagesRef.current[selectedIndex] = imagesRef.current[selectedIndex - 1];
        imagesRef.current[selectedIndex - 1] = temp;
        redrawCanvas();
      }
    }
  }, [selectedImageRef, imagesRef, redrawCanvas]);

  // 鍵盤事件處理
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedImage();
        redrawCanvas();
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const pasteHandler = createPasteHandler(
          canvasRef.current,
          imagesRef,
          handleImageAdded
        );
        pasteHandler();
      }

      if (e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        flipSelectedImageHorizontal();
      }

      if (e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        flipSelectedImageVertical();
      }
    },
    [
      deleteSelectedImage,
      redrawCanvas,
      canvasRef,
      imagesRef,
      handleImageAdded,
      flipSelectedImageHorizontal,
      flipSelectedImageVertical,
    ]
  );

  // 設置事件監聽器
  useEffect(() => {
    const pasteEventHandler = createPasteEventHandler(
      canvasRef.current,
      imagesRef,
      handleImageAdded
    );

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', pasteEventHandler);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', pasteEventHandler);
    };
  }, [handleKeyDown, canvasRef, imagesRef, handleImageAdded]);

  // 獲取選中的圖片對象
  const selectedImage = useMemo(() => {
    if (!selectedImageId) return null;
    return imagesRef.current.find((img) => img.id === selectedImageId);
  }, [selectedImageId, imagesRef]);

  // 清理函數
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [animationFrameRef, throttleTimer]);

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
        onDelete={() => {
          deleteSelectedImage();
          redrawCanvas();
        }}
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
};

import { createImageData } from '../utils/imageOperations';

// 處理拖放文件的邏輯
export const createDropHandler = (canvas, imagesRef, onImageAdded) => {
  return (e) => {
    const dataTransfer = e.dataTransfer;
    const file = dataTransfer.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 計算圖片置中要放的位置
        const widthCenter = canvas.width / 2 - img.width / 2;
        const heightCenter = canvas.height / 2 - img.height / 2;

        // 創建圖片資料
        const imageData = createImageData(
          e.target.result,
          widthCenter,
          heightCenter,
          img.width,
          img.height
        );

        // 將圖片資訊存入 ref
        imagesRef.current.push(imageData);

        // 通知上層組件
        if (onImageAdded) {
          onImageAdded(imageData);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
};

// 處理剪貼簿貼上圖片的邏輯
export const createPasteHandler = (canvas, imagesRef, onImageAdded) => {
  return async () => {
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
              if (!canvas) return;

              // 計算圖片置中要放的位置
              const widthCenter = canvas.width / 2 - img.width / 2;
              const heightCenter = canvas.height / 2 - img.height / 2;

              // 創建圖片資料
              const imageData = createImageData(
                e.target.result,
                widthCenter,
                heightCenter,
                img.width,
                img.height
              );

              imagesRef.current.push(imageData);

              // 通知上層組件
              if (onImageAdded) {
                onImageAdded(imageData, true); // true 表示自動選中
              }
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
      console.info('提示：請嘗試直接在頁面上按 Ctrl+V 來貼上圖片');
    }
  };
};

// 處理傳統的 paste 事件（作為備用方案）
export const createPasteEventHandler = (canvas, imagesRef, onImageAdded) => {
  return (e) => {
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
              if (!canvas) return;

              // 計算圖片置中要放的位置
              const widthCenter = canvas.width / 2 - img.width / 2;
              const heightCenter = canvas.height / 2 - img.height / 2;

              // 創建圖片資料
              const imageData = createImageData(
                e.target.result,
                widthCenter,
                heightCenter,
                img.width,
                img.height
              );

              imagesRef.current.push(imageData);

              // 通知上層組件
              if (onImageAdded) {
                onImageAdded(imageData, true); // true 表示自動選中
              }
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };
};

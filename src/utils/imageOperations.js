// 圖片操作相關的工具函數

// 檢測點擊是否在圖片範圍內
export const getClickedImage = (x, y, images) => {
  // 從後面開始檢查，因為後加入的圖片在上層
  for (let i = images.length - 1; i >= 0; i--) {
    const img = images[i];
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
export const getResizeHandle = (x, y, image) => {
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

// 創建新圖片數據
export const createImageData = (src, x, y, width, height) => ({
  id: crypto.randomUUID(),
  src,
  x,
  y,
  width,
  height,
  flipH: false, // 水平翻轉狀態
  flipV: false, // 垂直翻轉狀態
  opacity: 1, // 不透明度（0-1）
  pinned: false, // 是否固定位置
  effect: null, // 圖片效果
});

// 圖片變換操作
export const imageTransforms = {
  flipHorizontal: (image) => {
    image.flipH = !image.flipH;
  },

  flipVertical: (image) => {
    image.flipV = !image.flipV;
  },

  setOpacity: (image, opacity) => {
    image.opacity = Math.max(0, Math.min(1, opacity));
  },

  togglePin: (image) => {
    image.pinned = !image.pinned;
  },

  setEffect: (image, effectName) => {
    image.effect = image.effect === effectName ? null : effectName;
  },

  duplicate: (image, offsetX = 20, offsetY = 20) => ({
    ...image,
    id: crypto.randomUUID(),
    x: image.x + offsetX,
    y: image.y + offsetY,
  }),
};

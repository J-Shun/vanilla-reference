// 顏色選取器相關的工具函數

// 從畫布取得指定位置的顏色
export const getColorAtPosition = (
  x,
  y,
  canvasContext,
  virtualContext = null
) => {
  if (!canvasContext) return null;

  try {
    // 取得該像素的 RGBA 資料
    const imageData = canvasContext.getImageData(x, y, 1, 1);
    const data = imageData.data;

    // 轉換為十六進制格式
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const a = data[3];

    // 如果透明度為 0，嘗試從虛擬畫布取色
    if (a === 0 && virtualContext) {
      try {
        const virtualImageData = virtualContext.getImageData(x, y, 1, 1);
        const virtualData = virtualImageData.data;
        const vr = virtualData[0];
        const vg = virtualData[1];
        const vb = virtualData[2];
        const va = virtualData[3];

        if (va > 0) {
          return rgbToHex(vr, vg, vb);
        }
      } catch (virtualError) {
        console.log('無法從虛擬畫布取色:', virtualError);
      }
      return 'transparent';
    }

    // 轉換為十六進制
    return rgbToHex(r, g, b);
  } catch (error) {
    console.error('無法取得顏色資料:', error);
    return null;
  }
};

// RGB 轉十六進制
const rgbToHex = (r, g, b) => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

// 節流版本的取色函數
export const createThrottledColorPicker = (getColorFn) => {
  let lastPosition = { x: 0, y: 0 };
  let lastColor = null;

  return (x, y) => {
    // 檢查位置是否變化足夠大，避免頻繁取色
    const deltaX = Math.abs(x - lastPosition.x);
    const deltaY = Math.abs(y - lastPosition.y);

    if (deltaX < 2 && deltaY < 2) {
      return lastColor; // 返回上次的顏色
    }

    lastPosition = { x, y };
    lastColor = getColorFn(x, y);
    return lastColor;
  };
};

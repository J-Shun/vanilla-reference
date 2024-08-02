// 從主畫布中，將圖像轉換為灰階
// 有個小問題：只有在畫面上的部分轉為灰階，其他部分沒有轉換
function convertToGrayScale({ canvasContext, virtualContext }) {
  const canvas = canvasContext.canvas;
  // 獲取主畫布的圖像數據
  const imageData = canvasContext.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
  const data = imageData.data;

  // 將圖像數據轉換為灰階
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 計算灰度值
    const gray = 0.3 * r + 0.59 * g + 0.11 * b;

    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // 將灰階圖像數據繪製回主畫布
  canvasContext.putImageData(imageData, 0, 0);

  // 將處理後的圖像數據同步到虛擬畫布
  virtualContext.putImageData(imageData, 0, 0);
}

function applySepiaEffect({ canvasContext, virtualContext }) {
  const canvas = canvasContext.canvas;
  // 獲取主畫布的圖像數據
  const imageData = canvasContext.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
  const data = imageData.data;

  // 將圖像數據轉換為舊化效果
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 計算舊化值
    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;

    data[i] = tr > 255 ? 255 : tr;
    data[i + 1] = tg > 255 ? 255 : tg;
    data[i + 2] = tb > 255 ? 255 : tb;
  }

  // 將舊化圖像數據繪製回主畫布
  canvasContext.putImageData(imageData, 0, 0);

  // 將處理後的圖像數據同步到虛擬畫布
  virtualContext.putImageData(imageData, 0, 0);
}

export { convertToGrayScale, applySepiaEffect };

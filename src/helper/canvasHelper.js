import { virtualCanvasSize } from '../constant/size';

// 處理虛擬畫布的背景繪製（方塊）
// const drawVirtualCanvas = ({ context }) => {
//   context.fillStyle = '#ddd';
//   for (let x = 0; x < virtualCanvasSize.width; x += 50) {
//     for (let y = 0; y < virtualCanvasSize.height; y += 50) {
//       context.fillRect(x, y, 25, 25);
//     }
//   }
// };

// 處理虛擬畫布的背景繪製（方格）
const drawVirtualCanvas = ({ context }) => {
  context.strokeStyle = '#ddd';
  context.lineWidth = 1;

  // 繪製垂直線（相隔單位 50）
  for (let x = 0; x <= virtualCanvasSize.width; x += 50) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, virtualCanvasSize.height);
    context.stroke();
  }

  // 繪製水平線（相隔單位 50）
  for (let y = 0; y <= virtualCanvasSize.height; y += 50) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(virtualCanvasSize.width, y);
    context.stroke();
  }
};

// 處理主畫布中的可視區域
const updateVisibleCanvas = ({ canvas, canvasContext, virtualCanvas }) => {
  const xOffset = window.scrollX || document.documentElement.scrollLeft;
  const yOffset = window.scrollX || document.documentElement.scrollTop;

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.drawImage(
    virtualCanvas,
    xOffset,
    yOffset,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
};

// 從主畫布中，將圖像轉換為灰階
// 有個小問題：只有在畫面上的部分轉為灰階，其他部分沒有轉換
function convertToGrayScale({ canvas, canvasContext, virtualContext }) {
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

function applySepiaEffect({ canvas, canvasContext, virtualContext }) {
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

export {
  drawVirtualCanvas,
  updateVisibleCanvas,
  convertToGrayScale,
  applySepiaEffect,
};

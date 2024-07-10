import { virtualCanvasSize } from '../constant/size';

// 處理虛擬畫布的背景繪製
const drawVirtualCanvas = (context) => {
  context.fillStyle = '#ddd';
  for (let x = 0; x < virtualCanvasSize.width; x += 50) {
    for (let y = 0; y < virtualCanvasSize.height; y += 50) {
      context.fillRect(x, y, 25, 25);
    }
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
function convertToGrayScale({ canvas, canvasContext }) {
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
}

export { drawVirtualCanvas, updateVisibleCanvas, convertToGrayScale };

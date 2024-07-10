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

export { drawVirtualCanvas };

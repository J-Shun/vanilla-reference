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
  const xOffset = window.pageXOffset || document.documentElement.scrollLeft;
  const yOffset = window.pageYOffset || document.documentElement.scrollTop;

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

export { drawVirtualCanvas, updateVisibleCanvas };

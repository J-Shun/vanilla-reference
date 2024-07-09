import grid from '../assets/grid.svg';

/* 調整畫布大小 */
const resizeCanvas = ({ canvas }) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

/* 載入背景方格 */
const loadGrid = ({ canvas }) => {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.src = grid;
  });
};

/* 重繪背景以外匯入的圖片 */
const redrawImages = ({ offscreenCanvas, images }) => {
  const ctx = offscreenCanvas.getContext('2d');
  images.forEach((image) => {
    const img = new Image();
    img.src = image.src;
    img.onload = () => {
      ctx.drawImage(img, image.x, image.y, image.width, image.height);
    };
  });
};

export { resizeCanvas, loadGrid, redrawImages };

// 畫布繪製相關的邏輯

// 將圖片繪製到虛擬畫布的函數
export const drawImageToVirtualCanvas = (
  img,
  imgData,
  virtualContext,
  isSelected = false
) => {
  virtualContext.save();

  // 設定變換的中心點為圖片的中心
  const centerX = imgData.x + imgData.width / 2;
  const centerY = imgData.y + imgData.height / 2;

  // 移動到圖片中心
  virtualContext.translate(centerX, centerY);

  // 處理翻轉
  let scaleX = imgData.flipH ? -1 : 1;
  let scaleY = imgData.flipV ? -1 : 1;
  virtualContext.scale(scaleX, scaleY);

  // 設定不透明度
  virtualContext.globalAlpha = imgData.opacity || 1;

  // 應用圖片效果
  applyImageEffect(virtualContext, imgData.effect);

  // 繪製圖片（以中心為原點）
  virtualContext.drawImage(
    img,
    -imgData.width / 2,
    -imgData.height / 2,
    imgData.width,
    imgData.height
  );

  virtualContext.restore();

  // 如果是選中的圖片，繪製選中狀態的視覺效果
  if (isSelected) {
    drawSelectionIndicators(virtualContext, imgData);
  }
};

// 應用圖片效果
const applyImageEffect = (context, effect) => {
  switch (effect) {
    case 'grayscale':
      context.filter = 'grayscale(100%)';
      break;
    case 'sepia':
      context.filter = 'sepia(100%)';
      break;
    case 'blur':
      context.filter = 'blur(2px)';
      break;
    case 'brightness':
      context.filter = 'brightness(1.5)';
      break;
    case 'contrast':
      context.filter = 'contrast(1.5)';
      break;
    case 'saturate':
      context.filter = 'saturate(1.8)';
      break;
    case 'hue-rotate':
      context.filter = 'hue-rotate(90deg)';
      break;
    default:
      context.filter = 'none';
      break;
  }
};

// 繪製選中狀態的視覺指示器
const drawSelectionIndicators = (virtualContext, imgData) => {
  virtualContext.save();

  // 繪製虛線框
  virtualContext.strokeStyle = imgData.pinned ? '#ffa500' : '#ff0000'; // 固定的圖片用橙色框
  virtualContext.lineWidth = 2;
  virtualContext.setLineDash([5, 5]);
  virtualContext.strokeRect(
    imgData.x,
    imgData.y,
    imgData.width,
    imgData.height
  );

  // 繪製縮放控制區域提示
  drawResizeHandles(virtualContext, imgData);

  // 如果圖片被固定，在右上角繪製 pin 圖示
  if (imgData.pinned) {
    drawPinIcon(virtualContext, imgData);
  }

  virtualContext.restore();
};

// 繪製縮放控制區域
const drawResizeHandles = (virtualContext, imgData) => {
  const edgeThreshold = 15;
  const cornerThreshold = 30;

  virtualContext.save();
  virtualContext.strokeStyle = '#ff0000';
  virtualContext.lineWidth = 1;
  virtualContext.setLineDash([3, 3]);

  // 繪製邊緣區域
  // 左邊緣
  virtualContext.strokeRect(
    imgData.x,
    imgData.y,
    edgeThreshold,
    imgData.height
  );
  // 右邊緣
  virtualContext.strokeRect(
    imgData.x + imgData.width - edgeThreshold,
    imgData.y,
    edgeThreshold,
    imgData.height
  );
  // 上邊緣
  virtualContext.strokeRect(imgData.x, imgData.y, imgData.width, edgeThreshold);
  // 下邊緣
  virtualContext.strokeRect(
    imgData.x,
    imgData.y + imgData.height - edgeThreshold,
    imgData.width,
    edgeThreshold
  );

  // 繪製角落區域（更明顯的標示）
  virtualContext.setLineDash([]);
  virtualContext.fillStyle = 'rgba(255, 0, 0, 0.2)';
  // 四個角落
  virtualContext.fillRect(
    imgData.x,
    imgData.y,
    cornerThreshold,
    cornerThreshold
  );
  virtualContext.fillRect(
    imgData.x + imgData.width - cornerThreshold,
    imgData.y,
    cornerThreshold,
    cornerThreshold
  );
  virtualContext.fillRect(
    imgData.x,
    imgData.y + imgData.height - cornerThreshold,
    cornerThreshold,
    cornerThreshold
  );
  virtualContext.fillRect(
    imgData.x + imgData.width - cornerThreshold,
    imgData.y + imgData.height - cornerThreshold,
    cornerThreshold,
    cornerThreshold
  );

  virtualContext.restore();
};

// 繪製釘選圖示
const drawPinIcon = (virtualContext, imgData) => {
  virtualContext.save();
  virtualContext.fillStyle = '#ffa500';
  virtualContext.strokeStyle = '#fff';
  virtualContext.lineWidth = 2;

  const pinX = imgData.x + imgData.width - 20;
  const pinY = imgData.y + 5;
  const pinSize = 12;

  // 繪製 pin 圖示背景圓圈
  virtualContext.beginPath();
  virtualContext.arc(pinX, pinY, pinSize / 2 + 2, 0, Math.PI * 2);
  virtualContext.fill();
  virtualContext.stroke();

  // 繪製 pin 圖示
  virtualContext.fillStyle = '#fff';
  virtualContext.font = 'bold 10px Arial';
  virtualContext.textAlign = 'center';
  virtualContext.textBaseline = 'middle';
  virtualContext.fillText('📌', pinX, pinY);

  virtualContext.restore();
};

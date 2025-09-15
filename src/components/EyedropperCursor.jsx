/* eslint-disable react/prop-types */
import './EyedropperCursor.css';

const EyedropperCursor = ({ x, y, isActive, previewColor }) => {
  if (!isActive) return null;

  return (
    <div
      className='eyedropper-cursor'
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 十字準星 */}
      <div className='crosshair'>
        <div className='crosshair-horizontal'></div>
        <div className='crosshair-vertical'></div>
      </div>

      {/* 中心點 */}
      <div className='center-dot'></div>

      {/* 放大鏡圓圈 */}
      <div className='magnifier-circle'>
        <div className='magnifier-inner'></div>
      </div>

      {/* 座標顯示 */}
      <div className='coordinates'>
        {Math.round(x)}, {Math.round(y)}
      </div>

      {/* 顏色預覽 */}
      {previewColor && previewColor !== 'transparent' && (
        <div className='color-preview-tooltip'>
          <div
            className='preview-color-swatch'
            style={{ backgroundColor: previewColor }}
          ></div>
          <span className='preview-color-text'>{previewColor}</span>
        </div>
      )}
    </div>
  );
};

export default EyedropperCursor;

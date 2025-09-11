/* eslint-disable react/prop-types */
import { useState } from 'react';
import './ImageControlPanel.css';

const ImageControlPanel = ({
  selectedImage,
  onFlipHorizontal,
  onFlipVertical,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onOpacityChange,
  onTogglePin,
  onEffectChange,
}) => {
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showEffectSelector, setShowEffectSelector] = useState(false);

  if (!selectedImage) return null;

  const handleOpacityChange = (e) => {
    const opacity = parseFloat(e.target.value);
    onOpacityChange(opacity);
  };

  const toggleOpacitySlider = () => {
    setShowOpacitySlider(!showOpacitySlider);
  };

  return (
    <div className='image-control-panel'>
      <div className='panel-content'>
        <div className='panel-section'>
          <span className='section-label'>翻轉</span>
          <div className='button-group'>
            <button
              className='control-button'
              onClick={onFlipHorizontal}
              title='水平翻轉'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M15,21H9V9H15M11,7V3H13V7M7,7V3H9V7H7M15,7V3H17V7H15Z' />
              </svg>
              水平翻轉
            </button>
            <button
              className='control-button'
              onClick={onFlipVertical}
              title='垂直翻轉'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M9,3H15V15H9M7,17H3V15H7M7,21H3V19H7M7,15H3V13H7Z' />
              </svg>
              垂直翻轉
            </button>
          </div>
        </div>

        <div className='panel-section'>
          <span className='section-label'>圖層</span>
          <div className='button-group'>
            <button
              className='control-button'
              onClick={onBringToFront}
              title='向前移動一層'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M19,15H15A3,3 0 0,1 12,12A3,3 0 0,1 15,9H19A3,3 0 0,1 22,12A3,3 0 0,1 19,15M15,11A1,1 0 0,0 14,12A1,1 0 0,0 15,13H19A1,1 0 0,0 20,12A1,1 0 0,0 19,11H15M9,7H5A3,3 0 0,1 2,4A3,3 0 0,1 5,1H9A3,3 0 0,1 12,4A3,3 0 0,1 9,7M5,3A1,1 0 0,0 4,4A1,1 0 0,0 5,5H9A1,1 0 0,0 10,4A1,1 0 0,0 9,3H5Z' />
              </svg>
              前移一層
            </button>
            <button
              className='control-button'
              onClick={onSendToBack}
              title='向後移動一層'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M2,2H11V6H9V4H4V9H6V11H2V2M22,13V22H13V18H15V20H20V15H18V13H22M8,8V19H19V8H8Z' />
              </svg>
              後移一層
            </button>
          </div>
        </div>

        <div className='panel-section'>
          <span className='section-label'>外觀</span>
          <div className='button-group'>
            <button
              className={`control-button ${showOpacitySlider ? 'active' : ''}`}
              onClick={toggleOpacitySlider}
              title='調整不透明度'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M17.66,8L12,2.35L6.34,8C4.78,9.56 4,11.64 4,13.64S4.78,17.73 6.34,19.29C7.9,20.85 9.98,21.64 12,21.64C14.02,21.64 16.1,20.85 17.66,19.29C19.22,17.73 20,15.64 20,13.64S19.22,9.56 17.66,8M6,14C6,12 8,10 12,10V19C8,19 6,16 6,14Z' />
              </svg>
              不透明度
            </button>
            <button
              className={`control-button ${
                selectedImage.pinned ? 'active' : ''
              }`}
              onClick={onTogglePin}
              title={selectedImage.pinned ? '取消固定位置' : '固定位置'}
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z' />
              </svg>
              {selectedImage.pinned ? '取消固定' : '固定位置'}
            </button>
            <button
              className={`control-button ${showEffectSelector ? 'active' : ''}`}
              onClick={() => setShowEffectSelector(!showEffectSelector)}
              title='圖片效果'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L19,5V6.5L17,4.5L15,6.5V5L13,7V9L15,11V16L13,18V20L15,22V20.5L17,22.5L19,20.5V22L21,20V18L19,16V11L21,9M8,16L6,14V16L4,18V20L6,22V20L8,18V16Z' />
              </svg>
              效果
            </button>
          </div>
          {showEffectSelector && (
            <div className='effect-selector-container'>
              <div className='effect-selector-wrapper'>
                <select
                  value={selectedImage.effect || ''}
                  onChange={(e) => onEffectChange(e.target.value)}
                  className='effect-selector'
                >
                  <option value=''>無效果</option>
                  <option value='grayscale'>黑白效果</option>
                </select>
              </div>
            </div>
          )}
          {showOpacitySlider && (
            <div className='opacity-slider-container'>
              <div className='opacity-slider-wrapper'>
                <span className='opacity-label'>0%</span>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value={selectedImage.opacity || 1}
                  onChange={handleOpacityChange}
                  className='opacity-slider'
                />
                <span className='opacity-label'>100%</span>
              </div>
              <div className='opacity-value'>
                {Math.round((selectedImage.opacity || 1) * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className='panel-section'>
          <span className='section-label'>操作</span>
          <div className='button-group'>
            <button
              className='control-button'
              onClick={onDuplicate}
              title='複製'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z' />
              </svg>
              複製
            </button>
            <button
              className='control-button delete-button'
              onClick={onDelete}
              title='刪除'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z' />
              </svg>
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageControlPanel;

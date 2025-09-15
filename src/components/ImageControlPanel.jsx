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
            <div className='effect-panel'>
              <div className='effect-panel-header'>
                <span className='effect-panel-title'>選擇效果</span>
              </div>
              <div className='effect-options'>
                <button
                  className={`effect-option ${
                    !selectedImage.effect ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('')}
                  title='無效果'
                >
                  <div className='effect-preview no-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M19,7H5A2,2 0 0,0 3,9V15A2,2 0 0,0 5,17H19A2,2 0 0,0 21,15V9A2,2 0 0,0 19,7M19,15H5V9H19V15Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>原始</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'grayscale' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('grayscale')}
                  title='黑白效果'
                >
                  <div className='effect-preview grayscale-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20V4Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>黑白</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'sepia' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('sepia')}
                  title='復古效果'
                >
                  <div className='effect-preview sepia-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,1 12,4Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>復古</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'blur' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('blur')}
                  title='模糊效果'
                >
                  <div className='effect-preview blur-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12M12,3A9,9 0 0,1 21,12A9,9 0 0,1 12,21A9,9 0 0,1 3,12A9,9 0 0,1 12,3M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>模糊</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'brightness' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('brightness')}
                  title='亮度增強'
                >
                  <div className='effect-preview brightness-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>亮度</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'contrast' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('contrast')}
                  title='對比增強'
                >
                  <div className='effect-preview contrast-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20V4Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>對比</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'saturate' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('saturate')}
                  title='飽和度增強'
                >
                  <div className='effect-preview saturate-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M17.66,8L12,2.35L6.34,8C4.78,9.56 4,11.64 4,13.64S4.78,17.73 6.34,19.29C7.9,20.85 9.98,21.64 12,21.64C14.02,21.64 16.1,20.85 17.66,19.29C19.22,17.73 20,15.64 20,13.64S19.22,9.56 17.66,8Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>飽和</span>
                </button>

                <button
                  className={`effect-option ${
                    selectedImage.effect === 'hue-rotate' ? 'active' : ''
                  }`}
                  onClick={() => onEffectChange('hue-rotate')}
                  title='色調旋轉'
                >
                  <div className='effect-preview hue-rotate-effect'>
                    <svg viewBox='0 0 24 24' className='effect-icon'>
                      <path d='M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M7.07,18.28C7.5,17.38 8.12,16.5 8.91,15.66L9.5,15.07L9.88,14.69C10.5,14.07 11.13,13.5 11.77,13C12.4,12.5 13.03,12.04 13.66,11.63L14.25,11.25L14.62,11C15.25,10.63 15.87,10.25 16.5,9.91C17.12,9.56 17.75,9.25 18.37,8.97C18.75,8.81 19.12,8.69 19.5,8.59C19.66,8.56 19.82,8.5 20,8.5C20.18,8.5 20.34,8.56 20.5,8.59C20.87,8.69 21.25,8.81 21.62,8.97C22.25,9.25 22.87,9.56 23.5,9.91C23.87,10.25 24.25,10.63 24.62,11L25,11.25L25.37,11.63C26,12.04 26.62,12.5 27.25,13C27.87,13.5 28.5,14.07 29.12,14.69L29.5,15.07L30.09,15.66C30.87,16.5 31.5,17.38 31.93,18.28C31.97,18.5 32,18.75 32,19C32,19.25 31.97,19.5 31.93,19.72C31.5,20.62 30.87,21.5 30.09,22.34L29.5,22.93L29.12,23.31C28.5,23.93 27.87,24.5 27.25,25C26.62,25.5 26,25.96 25.37,26.37L25,26.75L24.62,27C24,27.37 23.37,27.75 22.75,28.09C22.12,28.44 21.5,28.75 20.87,29.03C20.5,29.19 20.12,29.31 19.75,29.41C19.59,29.44 19.43,29.5 19.25,29.5C19.07,29.5 18.91,29.44 18.75,29.41C18.37,29.31 18,29.19 17.62,29.03C17,28.75 16.37,28.44 15.75,28.09C15.37,27.75 15,27.37 14.62,27L14.25,26.75L13.87,26.37C13.25,25.96 12.62,25.5 12,25C11.37,24.5 10.75,23.93 10.12,23.31L9.75,22.93L9.16,22.34C8.37,21.5 7.75,20.62 7.32,19.72C7.28,19.5 7.25,19.25 7.25,19C7.25,18.75 7.28,18.5 7.32,18.28Z' />
                    </svg>
                  </div>
                  <span className='effect-name'>色調</span>
                </button>
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

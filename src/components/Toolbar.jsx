/* eslint-disable react/prop-types */
import './Toolbar.css';

const Toolbar = ({
  onEyedropperToggle,
  isEyedropperActive,
  eyedropperColor,
}) => {
  return (
    <div className='toolbar'>
      <div className='toolbar-content'>
        {/* 吸管工具 */}
        <div className='tool-section'>
          <button
            className={`tool-button ${isEyedropperActive ? 'active' : ''}`}
            onClick={onEyedropperToggle}
            title='吸管工具 - 點擊畫面取色'
          >
            <svg viewBox='0 0 24 24' className='tool-icon'>
              <path d='M17.7,5.6L16.3,4.2L15.6,4.9L12.4,1.7C12,1.3 11.4,1.3 11,1.7L9.6,3.1C9.2,3.5 9.2,4.1 9.6,4.5L12.8,7.7L4.2,16.3C3.8,16.7 3.8,17.3 4.2,17.7L6.3,19.8C6.7,20.2 7.3,20.2 7.7,19.8L16.3,11.2L19.5,14.4C19.9,14.8 20.5,14.8 20.9,14.4L22.3,13C22.7,12.6 22.7,12 22.3,11.6L19.1,8.4L19.8,7.7L18.4,6.3L17.7,5.6Z' />
            </svg>
            <span className='tool-label'>吸管</span>
          </button>
        </div>

        {/* 取色結果顯示 */}
        {eyedropperColor && (
          <div className='color-result'>
            <div className='color-info'>
              <div
                className='color-swatch'
                style={{ backgroundColor: eyedropperColor }}
                title={`取得的顏色: ${eyedropperColor}`}
              ></div>
              <div className='color-details'>
                <span className='color-label'>已取色</span>
                <span className='color-code'>{eyedropperColor}</span>
              </div>
            </div>
            <button
              className='copy-color-btn'
              onClick={() => {
                navigator.clipboard.writeText(eyedropperColor);
                // 可以加入複製成功的提示
              }}
              title='複製顏色代碼'
            >
              <svg viewBox='0 0 24 24' className='copy-icon'>
                <path d='M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z' />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;

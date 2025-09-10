/* eslint-disable react/prop-types */
import './ImageControlPanel.css';

const ImageControlPanel = ({
  selectedImage,
  onFlipHorizontal,
  onFlipVertical,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
}) => {
  if (!selectedImage) return null;

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
              title='移到最前'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M19,15H15A3,3 0 0,1 12,12A3,3 0 0,1 15,9H19A3,3 0 0,1 22,12A3,3 0 0,1 19,15M15,11A1,1 0 0,0 14,12A1,1 0 0,0 15,13H19A1,1 0 0,0 20,12A1,1 0 0,0 19,11H15M9,7H5A3,3 0 0,1 2,4A3,3 0 0,1 5,1H9A3,3 0 0,1 12,4A3,3 0 0,1 9,7M5,3A1,1 0 0,0 4,4A1,1 0 0,0 5,5H9A1,1 0 0,0 10,4A1,1 0 0,0 9,3H5Z' />
              </svg>
              移到前面
            </button>
            <button
              className='control-button'
              onClick={onSendToBack}
              title='移到最後'
            >
              <svg viewBox='0 0 24 24' className='button-icon'>
                <path d='M2,2H11V6H9V4H4V9H6V11H2V2M22,13V22H13V18H15V20H20V15H18V13H22M8,8V19H19V8H8Z' />
              </svg>
              移到後面
            </button>
          </div>
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

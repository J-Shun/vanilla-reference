// 防止瀏覽器預設行為（如：開啟）
export const preventDefaults = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

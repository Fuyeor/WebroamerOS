// @/shared/utils/is-image.ts
/**
 * 判断字符串是否为合法的图片路径或 URL
 * 涵盖：远程链接、绝对路径、Base64
 */
export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  return (
    url.startsWith('http') ||
    url.startsWith('/') ||
    url.startsWith('data:image') ||
    url.startsWith('blob:')
  );
};

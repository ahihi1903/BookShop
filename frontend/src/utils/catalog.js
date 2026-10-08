export function getEffectiveBookPrice(book) {
  const price = Number(book?.price ?? 0);
  const discountPrice = book?.discountPrice == null ? null : Number(book.discountPrice);
  return Number.isFinite(discountPrice) && discountPrice > 0 && discountPrice < price ? discountPrice : price;
}

export function resolveImageUrl(imagePath) {
  if (!imagePath) return '';
  try {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return new URL(imagePath, baseUrl).toString();
  } catch {
    return imagePath;
  }
}

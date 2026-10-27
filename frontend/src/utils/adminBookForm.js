export const bookFormFields = ['title', 'author', 'categoryId', 'price', 'discountPrice', 'stock', 'description', 'status'];

export function createBookForm(book = {}) {
  return Object.fromEntries(bookFormFields.map((key) => [key, book[key] == null ? '' : String(book[key])]));
}

function numberValue(value, label, integer = false) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`Vui lòng nhập ${label.toLowerCase()}.`);
  const normalized = /^\d{1,3}(?:\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text.replace(',', '.');
  if (!(integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(normalized)) throw new Error(`${label} phải là số ${integer ? 'nguyên ' : ''}không âm hợp lệ.`);
  const result = Number(normalized);
  if (!Number.isFinite(result) || result > (integer ? 2147483647 : 99999999.99)) throw new Error(`${label} vượt quá giới hạn cho phép.`);
  return result;
}

export function buildBookPayload(form, original) {
  const baseline = createBookForm(original);
  const payload = {};
  for (const key of bookFormFields) {
    if (original && String(form[key] ?? '') === baseline[key]) continue;
    const value = String(form[key] ?? '').trim();
    if (key === 'price') payload[key] = numberValue(value, 'Giá');
    else if (key === 'stock') payload[key] = numberValue(value, 'Tồn kho', true);
    else if (key === 'discountPrice') payload[key] = value === '' ? null : numberValue(value, 'Giá ưu đãi');
    else if (key === 'status') { if (value) payload[key] = value; }
    else payload[key] = value;
  }
  const price = payload.price ?? Number(original?.price);
  const discount = Object.hasOwn(payload, 'discountPrice') ? payload.discountPrice : original?.discountPrice;
  if (discount != null && Number(discount) > 0 && Number(discount) >= price) throw new Error('Giá ưu đãi phải thấp hơn giá gốc.');
  return payload;
}

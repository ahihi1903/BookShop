"""Build an additive catalogue manifest from the existing, offline TASCHEN archive."""
import base64
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

root = Path(__file__).resolve().parents[2]
archive = root / 'taschen-local'
scripts = root / 'backend/scripts'
catalog = json.loads((archive / 'shop-data.json').read_text(encoding='utf-8'))['products']
selected = json.loads((scripts / 'catalog-expansion-source.json').read_text(encoding='utf-8'))
summaries = json.loads((scripts / 'catalog-expansion-summaries.json').read_text(encoding='utf-8'))
replacements = {'40751': '40775', '44089': '44862'}
languages = {'GB': 'Tiếng Anh', 'D': 'Tiếng Đức', 'F': 'Tiếng Pháp', 'E': 'Tiếng Tây Ban Nha', 'I': 'Tiếng Ý', 'J': 'Tiếng Nhật'}
books = []
sources = []
for item in selected:
    product_id = replacements.get(item['id'], item['id'])
    product = catalog[product_id]
    source = 'https://www.taschen.com' + product['path']
    page = archive / 'cache/pages' / (hashlib.sha256(source.encode()).hexdigest() + '.html')
    html = page.read_text(encoding='utf-8')
    data = json.loads(re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html).group(1))['props']['pageProps']['pageData']['data']['self']
    graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html).group(1))['@graph']
    book = next(node for node in graph if 'Book' in node.get('@type', []))
    variant = next((node for node in data.get('makaira-product', []) if 'GB' in str(next((attr['value'] for attr in node.get('attributeStr', []) if attr['title'] == 'language'), ''))), data)
    attrs = {attr['title']: attr['value'] for attr in variant.get('attributeStr', [])}
    specs = {attr['title']: attr['value'] for attr in variant.get('attributeInt', [])}
    isbn = attrs.get('isbn') or book.get('isbn')
    if isinstance(isbn, list): isbn = isbn[0]
    names = list(dict.fromkeys(person['name'].strip() for field in ['author', 'editor', 'contributor'] for person in book.get(field, []) if person.get('name') and person['name'].strip() != 'Taschen'))
    # Explicitly credited in the archived long description, rather than JSON-LD.
    if product_id == '18509': names = ['Bjarke Ingels Group (BIG)']
    if product_id == '05311': names = ['Giovanni Bianco']
    author = ', '.join(names)
    assert author and len(author) <= 180, (product_id, author)
    assert isbn and specs.get('pages'), product_id
    edition_languages = attrs.get('language', [])
    if isinstance(edition_languages, str): edition_languages = [edition_languages]
    language = ', '.join(languages.get(code, code) for code in edition_languages)
    binding = {'Hardcover': 'Bìa cứng', 'Softcover': 'Bìa mềm', 'Paperback': 'Bìa mềm'}.get(variant.get('binding'), variant.get('binding'))
    facts = [f"Tác giả / biên soạn: {author}.", 'Nhà xuất bản: TASCHEN.', f'ISBN: {isbn}.', f"Số trang: {specs['pages']}.", f'Hình thức: {binding}.', f'Ngôn ngữ ấn bản: {language}.']
    # Specs have millimetres/grams in the archived product feed.
    if specs.get('width_amount') and specs.get('length_amount'):
        facts.append(f"Khổ sách: {specs['width_amount'] / 10:g} × {specs['length_amount'] / 10:g} cm.")
    if specs.get('weight_amount'): facts.append(f"Khối lượng: {specs['weight_amount']} g.")
    image_url = parse_qs(urlparse(product['image']).query)['url'][0]
    asset = json.loads((archive / 'cache/assets' / hashlib.sha256(image_url.encode()).hexdigest()).read_text(encoding='utf-8'))
    extension = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png'}[asset['type'].split(';')[0]]
    image_path = f'/uploads/books/taschen-expansion-{product_id}.{extension}'
    image_bytes = base64.b64decode(asset['body'], validate=True)
    assert len(image_bytes) > 1000, product_id
    destination = root / 'backend' / image_path.lstrip('/')
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists(): assert destination.read_bytes() == image_bytes
    else: destination.write_bytes(image_bytes)
    record = {
        'title': product['title'].strip(), 'slug': product['path'].strip('/').split('/')[-1],
        'author': author, 'isbn': isbn, 'publisher': 'TASCHEN',
        'description': summaries[product_id] + '\n\nTHÔNG TIN ẤN BẢN\n' + '\n'.join(facts),
        'image': image_path, 'price': round(float(product['price']) * 28000),
        'stock': 12, 'status': 'ACTIVE', 'categorySlug': item['categorySlug'],
    }
    books.append(record)
    sources.append({'id': product_id, 'categorySlug': item['categorySlug'], 'title': record['title'], 'source': source, 'isbn': isbn, 'language': language, 'binding': binding, 'specs': specs, 'sourcePrice': product['price'], 'sourceImage': image_url, 'imageSha256': hashlib.sha256(image_bytes).hexdigest(), 'publishedAt': book.get('datePublished')})
assert len(books) == 65
assert len({book['isbn'] for book in books}) == 65
for category in {book['categorySlug'] for book in books}: assert sum(book['categorySlug'] == category for book in books) == 13
manifest = {'notice': 'Owner approved local demo prices: archived price × 28000 VND; stock 12. Not current TASCHEN prices or inventory. Vietnamese summaries written for BookShop. Publication dates unavailable in archive and left null. Different editions have different ISBNs.', 'books': books, 'sources': sources}
(scripts / 'catalog-expansion.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'prepared': len(books), 'images': len(sources), 'categories': sorted({book['categorySlug'] for book in books})}))

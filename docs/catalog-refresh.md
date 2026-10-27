# Bộ sách mới — 27/10/2026

Đã thay bộ dữ liệu cũ sau khi chủ dự án xác nhận xóa cả lịch sử đơn hàng và đánh giá liên quan.

- Xóa 5 sách, 5 danh mục, 5 đơn hàng, 15 chi tiết đơn hàng, 3 thanh toán, 2 đánh giá.
- Tạo 10 sách, 5 danh mục trong cùng một transaction Serializable.
- Không thay schema; không reset database. Tài khoản, điểm thành viên, khuyến mãi được giữ nguyên. Điểm hiện có không được tính lại từ các đơn hàng đã xóa.
- Backup trước thao tác: `backend/.local-backups/catalog-before-replacement-1793038360621.json`. Thư mục này không phục vụ qua HTTP và được gitignore. Backup có dữ liệu giao hàng, cần giữ riêng tư.
- Script một lần: `backend/scripts/replace-book-catalog.js`; mặc định chỉ xem kế hoạch, `--apply` mới ghi. Script kiểm tra chính xác ID sách cũ, nên không thể chạy lại để xóa bộ mới.

## Nguồn và dữ liệu khởi tạo

`backend/scripts/catalog-taschen.json` lưu nguồn từng sách, thông tin và giá trị đã nhập. Tên, ISBN, tác giả/người biên tập và bìa lấy từ kho TASCHEN local. Mô tả tiếng Việt được biên soạn lại ngắn gọn. Ảnh WebP nằm tại `backend/uploads/books/taschen-*.webp`.

Giá VND là giá khởi tạo cho dự án local: giá lưu trong kho tham khảo nhân hệ số minh họa 28.000; đây không phải tỷ giá hiện hành hoặc giá bán chính thức TASCHEN. Mỗi sách có tồn kho demo ban đầu 12. Cần nhập giá bán và tồn kho thực tế trước khi vận hành thương mại.

## Banner

Hiệu ứng lấy theo `taschen-local/local.js`: nhấn giữ chuột/kéo hoặc vuốt cảm ứng. Cả slide di chuyển liên tục theo khoảng kéo, hiện slide kế bên. Thả sau khi vượt ngưỡng khoảng cách hoặc vận tốc thì chuyển sách; kéo ngắn hoặc hủy thì hồi về. Thời gian chốt vị trí 320ms; ngăn click mở liên kết trong 500ms sau khi kéo. Có pointer capture, phân biệt kéo ngang với cuộn dọc, phím mũi tên và cuộn ngang trackpad. Tự chuyển mỗi 6,5 giây, dừng khi hover/focus/tương tác, tab ẩn hoặc giảm chuyển động.

Logic trong `frontend/src/hooks/useHeroCarousel.js`, giao diện trong `DiscoveryHero.jsx`, CSS tại `editorial.css`. Bỏ hoàn toàn chuyển slide bằng rê chuột không nhấn.
## Kiểm tra đã chạy

- Build Vite thành công; 13/13 test backend đạt.
- Database: 10 sách, 5 danh mục, không có sách thiếu ảnh; đơn hàng và đánh giá cũ đã xóa.
- API: 10 sách trả về; toàn bộ 10 URL ảnh HTTP 200.
- Trình duyệt: ảnh banner tải được; dịch trái/phải có offset âm/dương; nút trước/sau đổi đúng tiêu đề; không ghi nhận console error trong phiên kiểm tra.
- Chưa kiểm thử lại đặt hàng hoặc cảm ứng trên thiết bị thật trong lần thay dữ liệu này.

## Bổ sung 65 sách (27/10/2026)

- Nhập thêm 13 sách vào mỗi thể loại hiện có: Nghệ thuật, Kiến trúc & Thiết kế, Nhiếp ảnh, Điện ảnh và Thời trang. Sau khi nhập: 15 sách/thể loại, tổng 75.
- Chủ dự án đã chọn giữ giá demo = giá nguồn × 28.000 VNĐ và tồn kho 12/sách mới.
- Có ảnh local, tên, tác giả/người biên soạn, ISBN đúng checksum, nhà xuất bản và mô tả tiếng Việt. Số trang, ngôn ngữ, kiểu bìa, khổ sách và khối lượng được ghi trong phần mô tả chi tiết vì schema hiện tại chưa có trường riêng.
- Không lấy ngày bắt đầu bán làm ngày xuất bản. Nguồn không có ngày xuất bản xác nhận nên publishedAt của sách mới để null. Một số tác phẩm có các ấn bản khác nhau, phân biệt bằng ISBN.
- Manifest và nguồn: `backend/scripts/catalog-expansion.json`. Mô tả tiếng Việt: `catalog-expansion-summaries.json`. Nguồn trích xuất ban đầu: `catalog-expansion-source.json`; bước chuẩn bị chọn lại hai đầu sách để có thông tin người biên soạn rõ hơn.
- Chuẩn bị từ kho offline: `python backend/scripts/prepare-catalog-expansion.py`. Trong backend: `node scripts/import-catalog-expansion.js` xem kế hoạch; thêm `--apply` để nhập. Script chỉ thêm, bỏ qua ISBN/slug đã khớp, dừng khi có xung đột; không cập nhật hoặc xóa sách cũ.
- Backup trước nhập: `backend/.local-backups/catalog-before-expansion-1793043788992.json`. Kết quả cùng ID tạo mới: `backend/scripts/catalog-expansion-result.json`.
- Đã đối chiếu MySQL: 65 sách mới, không thiếu trường thông tin chính, 10 sách cũ không đổi. GET `/api/books?limit=48` trả 200, total=75, trang đầu 48 sách. Không migration, không reset database.

## Banner sách bán chạy

Banner chuyển slide tự động mỗi 3 giây (trượt 320ms), tạm dừng khi rê chuột, focus bàn phím, kéo ảnh, ẩn tab hoặc bật reduced motion. Home tải lại dữ liệu mỗi 30 giây khi tab hiển thị và khi quay lại tab, không xóa banner lúc tải nền.

`/api/books?featured=true` và `sort=best_selling` xếp theo tổng `OrderItem.quantity` của đơn DELIVERED, loại thanh toán FAILED/REFUNDED. Đồng hạng sắp ID tăng dần để phân trang ổn định; sách chưa bán có điểm 0 và nằm sau sách đã bán. Bộ lọc giá, danh mục, từ khóa và rating tiếp tục áp dụng trước phân trang. Không migration.

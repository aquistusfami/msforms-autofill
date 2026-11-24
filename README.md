# MS Forms Auto-Fill

Extension trình duyệt (Manifest V3, chạy trên cả **Chrome** và **Firefox**) hỗ trợ điền nhanh các biểu mẫu khảo sát trên Microsoft Forms (`forms.office.com`, `forms.cloud.microsoft`).

## Tính năng

- **3 thang thái độ theo phân phối xác suất tự nhiên** (tránh chọn đều y hệt nhau):
  - **Đồng ý / Tích cực:** Rất hài lòng `42%`, Hài lòng `46%`, Bình thường `12%` • Thang điểm 1–10: `8–10`.
  - **Trung lập:** Bình thường `47%`, Hài lòng `37%`, rải nhẹ hai bên `16%` • Thang điểm 1–10: `6–8`.
  - **Không đồng ý:** Không hài lòng `47%`, Rất không hài lòng `35%`, Bình thường `18%` • Thang điểm 1–10: `2–5`.
  - **Tự chọn cột thủ công:** tự tick các cột muốn random đều.
- **Nhất quán theo từng bảng:** các dòng có nhãn `tổng thể` / `overall` tự động khớp với trung bình làm tròn các dòng chi tiết trong cùng bảng.
- **Từ khóa `Không đánh giá`:** tự chọn cột cuối cho các dòng có 6 mức khớp từ khóa (vd: `ký túc xá, khuyết tật, vay vốn`).
- **An toàn:** hỗ trợ bỏ qua câu đã chọn sẵn và **không tự bấm Submit** để bạn rà lại trước khi gửi.
- Chỉ dùng quyền tối thiểu `activeTab` và `scripting`, chạy khi bạn bấm nút.

## Cài đặt

Clone hoặc tải source code về máy:

```bash
git clone https://github.com/aquistusfami/msforms-autofill.git
```

### Chrome / Chromium / Edge

1. Mở `chrome://extensions` (hoặc `edge://extensions`).
2. Bật **Developer mode** ở góc trên bên phải.
3. Bấm **Load unpacked** → chọn thư mục `msforms-autofill`.

### Firefox

1. Mở `about:debugging#/runtime/this-firefox`.
2. Bấm **Load Temporary Add-on...** → chọn file `manifest.json` (hoặc file `.zip` sau khi đóng gói).

*(Để cài cố định trên Firefox bản Release, đóng gói thành `.zip` rồi tải lên [Firefox Add-ons (AMO)](https://addons.mozilla.org/developers/) chọn **On your own** để ký ra file `.xpi`).*

## Cách sử dụng

1. Mở trang Microsoft Forms cần điền (đăng nhập tài khoản của bạn như bình thường).
2. Bấm biểu tượng **MS Forms Auto-Fill** trên thanh công cụ trình duyệt.
3. Chọn **Thang thái độ** (hoặc **Tự chọn cột thủ công**), nhập từ khóa cần chọn `Không đánh giá` nếu có, chọn cách điền câu 1 đáp án và thang điểm `1–10`.
4. Bấm **Điền form (không tự Submit)**.
5. Kiểm tra lại các câu đã điền (và điền tay các câu dropdown/tự luận nếu có), rồi tự bấm **Submit**.

## Kiểm thử & đóng gói

Chạy unit test (yêu cầu Node.js):

```bash
node fill.test.js
```

Đóng gói file `.zip` sạch để upload lên Chrome Web Store hoặc Firefox AMO:

```bash
zip -r msforms-autofill.zip manifest.json popup.html popup.js fill.js
```

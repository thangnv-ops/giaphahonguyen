---
project: AncestorTree
path: docs/04-build/INSTALLATION-GUIDE.md
type: installation-guide
version: 1.8.0
updated: 2026-02-26
owner: dev-team
status: approved
---

# Hướng dẫn Cài đặt — Gia Phả Điện Tử

Hướng dẫn cài đặt ứng dụng desktop cho **macOS** và **Windows**.

> Ứng dụng hoạt động hoàn toàn offline — không cần internet, không cần tài khoản cloud.

---

## Yêu cầu hệ thống

| Tiêu chí | macOS | Windows |
|-----------|-------|---------|
| **Hệ điều hành** | macOS 12 Monterey trở lên | Windows 10 (64-bit) trở lên |
| **Bộ xử lý** | Intel hoặc Apple Silicon (M1/M2/M3/M4) | Intel/AMD 64-bit |
| **RAM** | 4 GB trở lên | 4 GB trở lên |
| **Ổ cứng** | 300 MB trống | 300 MB trống |
| **Độ phân giải** | 1280×800 trở lên | 1280×800 trở lên |

---

## macOS

### Bước 1: Tải file cài đặt

Tải file **AncestorTree-x.x.x.dmg** từ trang [GitHub Releases](https://github.com/Minh-Tam-Solution/AncestorTree/releases).

- Máy Intel: chọn file `AncestorTree-x.x.x.dmg`
- Máy Apple Silicon (M1/M2/M3/M4): chọn file `AncestorTree-x.x.x-arm64.dmg`

> Không biết máy dùng chip nào? Nhấn vào biểu tượng Apple () ở góc trên bên trái → **Giới thiệu về máy Mac này**. Nếu thấy "Apple M1/M2/M3/M4" thì chọn arm64.

### Bước 2: Cài đặt

1. Mở file `.dmg` vừa tải
2. Kéo biểu tượng **Gia Phả Điện Tử** vào thư mục **Applications** (Ứng dụng)
3. Đóng cửa sổ cài đặt

![Kéo vào Applications](https://docs-assets.developer.apple.com/published/0239ad594b/drag-to-applications@2x.png)

### Bước 3: Mở ứng dụng lần đầu

Do ứng dụng chưa có chữ ký Apple Developer (sẽ có trong phiên bản chính thức), macOS sẽ hiện cảnh báo:

1. Vào **Applications** → Click phải (hoặc Control+Click) vào **Gia Phả Điện Tử**
2. Chọn **Open** (Mở)
3. Trong hộp thoại cảnh báo, nhấn **Open** (Mở)

> Chỉ cần làm bước này một lần. Các lần sau mở bình thường bằng cách click đúp.

**Cách 2 (nếu cách trên không được):**

1. Mở **System Settings** → **Privacy & Security**
2. Cuộn xuống, tìm dòng thông báo về ứng dụng bị chặn
3. Nhấn **Open Anyway** (Vẫn mở)
4. Nhập mật khẩu máy → Nhấn **Open**

### Bước 4: Thiết lập ban đầu

Lần đầu mở ứng dụng:

1. Đợi vài giây để ứng dụng khởi động
2. Ứng dụng sẽ hiển thị trang chủ với dữ liệu demo (18 thành viên, 5 đời)
3. Bạn có thể bắt đầu sử dụng ngay hoặc xóa dữ liệu demo để nhập dữ liệu thật

### Gỡ cài đặt

1. Mở thư mục **Applications**
2. Kéo **Gia Phả Điện Tử** vào thùng rác
3. (Tùy chọn) Xóa dữ liệu: mở Finder → Go → Go to Folder → nhập `~/AncestorTree` → xóa thư mục

---

## Windows

### Bước 1: Tải file cài đặt

Tải file **AncestorTree-Setup-x.x.x.exe** từ trang [GitHub Releases](https://github.com/Minh-Tam-Solution/AncestorTree/releases).

### Bước 2: Cài đặt

1. Mở file `.exe` vừa tải
2. **Windows SmartScreen** có thể hiện cảnh báo (vì ứng dụng chưa có chữ ký số):
   - Nhấn **More info** (Thêm thông tin)
   - Nhấn **Run anyway** (Vẫn chạy)
3. Chọn vị trí cài đặt (mặc định: `C:\Users\<TênBạn>\AppData\Local\AncestorTree`)
4. Nhấn **Install** (Cài đặt)
5. Đợi quá trình cài đặt hoàn tất
6. Nhấn **Finish** (Hoàn tất) — ứng dụng sẽ tự động mở

> Chỉ cần vượt qua SmartScreen một lần. Các lần sau mở bình thường.

### Bước 3: Mở ứng dụng

Sau khi cài đặt, bạn có thể mở ứng dụng bằng:

- **Start Menu** → Tìm **Gia Phả Điện Tử**
- **Desktop shortcut** (nếu đã chọn tạo shortcut lúc cài)
- **Taskbar** → Click phải vào biểu tượng ứng dụng → Pin to taskbar

### Bước 4: Thiết lập ban đầu

Giống macOS — ứng dụng sẽ tự động khởi động với dữ liệu demo.

### Gỡ cài đặt

1. **Settings** → **Apps** → **Installed apps**
2. Tìm **Gia Phả Điện Tử** → Nhấn **Uninstall**
3. (Tùy chọn) Xóa dữ liệu: mở Explorer → nhập `%USERPROFILE%\AncestorTree` → xóa thư mục

---

## Nơi lưu dữ liệu

| Hệ điều hành | Thư mục dữ liệu |
|---------------|-----------------|
| macOS | `~/AncestorTree/data/ancestortree.db` |
| Windows | `C:\Users\<TênBạn>\AncestorTree\data\ancestortree.db` |

| Loại | Đường dẫn |
|------|-----------|
| Database | `~/AncestorTree/data/ancestortree.db` |
| Ảnh/Media | `~/AncestorTree/media/` |

> **Sao lưu:** Copy toàn bộ thư mục `~/AncestorTree/` (hoặc `%USERPROFILE%\AncestorTree\`) ra USB hoặc cloud storage để backup.

---

## Cập nhật ứng dụng

Khi có phiên bản mới:

1. Ứng dụng sẽ tự động thông báo khi có bản cập nhật
2. Nhấn **Tải xuống** để tải bản mới
3. Sau khi tải xong, nhấn **Khởi động lại** để áp dụng
4. Dữ liệu của bạn **KHÔNG bị mất** khi cập nhật

> Nếu cập nhật tự động không hoạt động, bạn có thể tải phiên bản mới từ GitHub Releases và cài đè lên.

---

## Xử lý sự cố

### Ứng dụng không mở được

**macOS:**
- Thử Click phải → Open thay vì click đúp
- Kiểm tra System Settings → Privacy & Security → Open Anyway
- Xóa app khỏi Applications, tải lại và cài lại

**Windows:**
- Chạy file cài đặt dưới quyền Administrator (Click phải → Run as administrator)
- Kiểm tra Windows Defender không chặn ứng dụng

### Ứng dụng chạy chậm

- Đảm bảo máy có ít nhất 4 GB RAM trống
- Đóng các ứng dụng khác không cần thiết
- Với database lớn (>5000 thành viên), có thể cần thêm RAM

### Mất dữ liệu

- Kiểm tra thư mục `~/AncestorTree/data/` có file `ancestortree.db` không
- Nếu có file `ancestortree.db.bak` — đó là bản backup tự động trước khi migration
- Đổi tên `.bak` thành `.db` để khôi phục

### Lỗi "Đang khởi động..."

Nếu ứng dụng hiện "Đang khởi động..." quá 30 giây:
1. Đóng ứng dụng
2. Mở lại
3. Nếu vẫn lỗi, kiểm tra port 127.0.0.1 không bị firewall chặn

---

## Hỗ trợ

- **GitHub Issues:** [github.com/Minh-Tam-Solution/AncestorTree/issues](https://github.com/Minh-Tam-Solution/AncestorTree/issues)
- **Cộng đồng:** Theo dõi kênh hỗ trợ tại trang chủ dự án

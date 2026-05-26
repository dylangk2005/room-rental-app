# room-rental-app
Phần mềm đăng tin cho thuê phòng trọ

## Chạy bằng Docker

Yêu cầu: Docker Desktop hoặc Docker Engine có hỗ trợ Docker Compose.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- MySQL: localhost:3307, database `phongtro_db`
- Redis: localhost:6379

Tài khoản seed đều dùng mật khẩu `123456aA@`:

- `admin@phongtro.vn`
- `manager@phongtro.vn`
- `mod@phongtro.vn`
- `hoa.pham@gmail.com`
- `tuan.nguyen@gmail.com`

MySQL chỉ chạy file trong `docker/mysql/init` khi volume database được tạo lần đầu. Nếu đã từng chạy và muốn tạo lại schema/seed từ đầu:

```bash
docker compose down -v
docker compose up --build
```

Các secret cho Docker nằm trong file `.env`; xem `.env.example` để biết các biến cần cấu hình.

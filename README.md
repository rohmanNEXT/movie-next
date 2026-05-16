# Proyek Akhir Rohman

Proyek ini menggunakan React.js dengan NextJS untuk frontend, Express.js untuk backend, dan TurboRepo untuk manajemen monorepo. Hal ini memfasilitasi pengembangan cepat aplikasi web yang skalabel dengan kolaborasi yang efisien dan interaksi server-client yang cepat.

## Skrip yang Tersedia

### `npm run dev`

Menjalankan aplikasi dalam mode pengembangan 
Buka [http://localhost:3000](http://localhost:3000) untuk melihatnya di browser. Untuk API, Anda dapat mengaksesnya di [http://localhost:8000/api](http://localhost:8000/api). Aplikasi akan memuat ulang jika Anda melakukan perubahan.

### `npm run build`

Membangun aplikasi untuk produksi ke folder `dist` untuk setiap proyek.

### `npm run serve`

Menjalankan aplikasi dalam mode produksi.

### `npm run <task> --workspace=<app-name>`

Menjalankan perintah pada aplikasi tertentu (instal paket, jalankan tes, dll).

### `npm run <task> --workspace=<app-name> -- --<option>`

Menjalankan perintah pada aplikasi tertentu dengan opsi.

Contoh : `npm run sequelize --workspace=api -- --db:migrate`

# Aturan

## Komit & Pull Request

- Selalu gunakan [pesan komit konvensional](https://www.conventionalcommits.org/en/v1.0.0/) saat melakukan komit perubahan atau membuat pull request.
- **"Squash and Merge"** pull request Anda ke cabang main.

## Konvensi Penamaan

### REST API

- Selalu gunakan [konvensi penamaan REST API](https://restfulapi.net/resource-naming/)

### Konvensi Penamaan File:

1. **Gunakan CamelCase untuk nama file:**
   - Mulai nama file dengan huruf kecil.
   - Untuk beberapa kata, kapitalisasi huruf pertama dari setiap kata berikutnya.
   - Contoh: `index.js`, `userModel.js`, `dataAccess.js`

2. **Gunakan Nama yang Deskriptif:**
   - Pilih nama yang secara akurat menggambarkan tujuan atau isi file.
   - Hindari nama yang terlalu umum seperti `utils.js` kecuali file tersebut benar-benar berisi fungsi utilitas.

3. **Ikuti Konvensi Penamaan untuk Jenis File Tertentu:**
   - Untuk file konfigurasi, gunakan nama seperti `.env`, `config.js`, atau `settings.json`.
   - Gunakan penamaan yang konsisten untuk file tes, seperti menambahkan `.test.js` atau `.spec.js` pada nama file yang sedang diuji.
   - Gunakan `package.json` untuk metadata dan dependensi proyek.

4. **Pisahkan Kepentingan dengan Penamaan File:**
   - Ikuti struktur modular untuk kepentingan yang berbeda (misalnya, `userController.js`, `userService.js`, `userModel.js` untuk modul yang terkait dengan pengguna).

### Konvensi Penamaan Folder:

1. **Gunakan Penamaan Tunggal atau Jamak:**
   - Pilih konvensi yang konsisten untuk menamai folder (misalnya, `models` atau `model`, `routes` atau `route`).

2. **Hindari Karakter Khusus dan Spasi:**
   - Gunakan tanda hubung (`-`) atau garis bawah (`_`) untuk memisahkan kata dalam nama folder, tetapi hindari spasi atau karakter khusus.

3. **Gunakan Nama yang Deskriptif untuk Folder:**
   - Beri nama folder sesuai dengan isi atau tujuannya (misalnya, `controllers`, `services`, `utils`, `tests`, `public`, `views`, dll).

4. **Struktur Folder Bersarang:**
   - Buat struktur folder yang logis dan terorganisir berdasarkan arsitektur proyek.
   - Untuk proyek yang lebih besar, pertimbangkan untuk mengatur file berdasarkan fitur/modul (Struktur Berbasis Fitur) atau berbasis lapisan (Struktur Berlapis).

# Role Management

## Admin vs Superadmin

| Role | Deskripsi | Hak Akses |
|------|-----------|-----------|
| **Admin** | Kontributor Konten | Hanya dapat mengelola (view/edit/delete) film yang ia buat sendiri. |
| **Superadmin** | Pemilik Platform | Memiliki akses total. Dapat melihat dan mengelola film dari seluruh admin di database. |

### Cara Mengubah Role ke Superadmin
Role Superadmin tidak dapat dipilih melalui form pendaftaran. Anda harus mengubahnya secara manual melalui database:
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'email_anda@gmail.com';
```

# Postman API Documentation

## 1. Register User / Admin
Gunakan endpoint ini untuk membuat akun baru. Anda dapat langsung menentukan role `user` atau `admin`.

- **URL**: `http://localhost:8000/api/register`
- **Method**: `POST`
- **Body** (JSON):
  ```json
  {
    "fullName": "Admin Satu",
    "username": "admin1",
    "email": "admin1@example.com",
    "password": "password123",
    "role": "admin"
  }
  ```
- **Aturan**:
  - Field `role` hanya menerima `user` atau `admin`.
  - Jika `role` tidak diisi, otomatis menjadi `user`.
  - Untuk menjadi `superadmin`, ikuti panduan di bagian "Role Management" di atas.

## 2. CRUD Movies (Kelola Film)

### Create Movie (Tambah Film)
- **URL**: `http://localhost:8000/api/movies`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token_anda>`
- **Body** (Multipart/Form-Data):
  - `title`: String (Judul film)
  - `category`: String (Series, Action, Anime, dll)
  - `image`: File (Cover film)
  - `trailerId`: String (ID YouTube)
  - `rating`: Float (0-10)

### Read Movies (Ambil Film)
- **URL**: `http://localhost:8000/api/movies`
- **Method**: `GET`
- **Query Params**: 
  - `page`: Angka (Default: 1)
  - `limit`: Angka (Default: 10)
  - `search`: String (Cari judul)
  - `category`: String (Filter kategori)

### Update Movie (Ubah Film)
- **URL**: `http://localhost:8000/api/movies/:id`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token_anda>`
- **Body** (Multipart/Form-Data):
  - Sesuai field yang ingin diubah.

### Delete Movie (Hapus Film)
- **URL**: `http://localhost:8000/api/movies/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token_anda>`

## Aturan Penggunaan API
1. **Token**: Untuk operasi CUD (Create, Update, Delete) pada film, Anda wajib menyertakan Bearer Token yang didapat setelah login.
2. **Hak Akses Admin**: Admin hanya bisa mengedit atau menghapus film yang **dia buat sendiri**.
3. **Hak Akses Superadmin**: Superadmin bisa mengelola (edit/delete) film milik **siapa saja**.
4. **Data Seed**: Dilarang keras menggunakan file seed untuk mengisi database dengan data palsu. Semua data harus diinput secara manual atau via API menggunakan data asli.

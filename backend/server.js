
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

dotenv.config();

console.log(
    "Groq API Key terbaca:",
    Boolean(process.env.GROQ_API_KEY)
);

const app = express();
const PORT = 3000;

console.log("Server.js berhasil dibaca...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Menampilkan website Taskly
const frontendPath = path.join(__dirname, "../taskly");

app.use(express.static(frontendPath));


// Mengecek koneksi backend
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend Taskly berhasil dijalankan"
    });
});


// Analisis tugas menggunakan Groq
app.post("/api/analyze", upload.single("file"), async (req, res) => {
    try {
        const text = req.body.text || "";
        const file = req.file;

        if (!text.trim() && !file) {
            return res.status(400).json({
                success: false,
                message: "Masukkan teks atau unggah file tugas terlebih dahulu."
            });
        }

        // Memeriksa format file
        if (file) {
            const allowedTypes = [
                "text/plain",
                "application/pdf",
                "image/png",
                "image/jpeg",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: "Format file belum didukung. Gunakan PDF, TXT, JPG, PNG, atau WEBP."
                });
            }
        }

        // PDF harus memiliki teks hasil ekstraksi
        if (
            file &&
            file.mimetype === "application/pdf" &&
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "PDF belum memiliki teks yang bisa dibaca. Untuk sementara, gunakan PDF yang teksnya bisa diseleksi atau unggah halaman sebagai gambar."
            });
        }

        // INSTRUKSI UNTUK GROQ
        const prompt = `
Kamu adalah asisten akademik Taskly yang membantu mahasiswa
memahami dan menyelesaikan tugas kuliah.

Analisis instruksi tugas berikut secara menyeluruh.

Jika diberikan gambar:
- Baca seluruh tulisan yang terlihat pada gambar.
- Kenali instruksi, judul, ketentuan, dan deadline tugas.
- Jika tulisan tidak jelas, jangan mengarang isinya.
- Analisis isi gambar sebagai instruksi tugas mahasiswa.

Jika diberikan teks dokumen:
- Baca seluruh teks dan pahami instruksinya.

Aturan:
- Gunakan bahasa Indonesia sederhana.
- Jangan hanya merangkum instruksi.
- Buat langkah praktik yang konkret dan berurutan.
- Jelaskan apa yang harus dilakukan mahasiswa pada setiap langkah.
- Untuk tugas pemrograman, berikan tahapan pengerjaan dan kode jika relevan.
- Jangan mengarang informasi yang tidak ada dalam instruksi.
- Deadline harus diambil dari instruksi asli.
- Jika deadline tidak ditemukan, isi dengan string kosong.
- Jika informasi tidak tersedia, jangan membuat-buat informasi.
- Buat hasil analisis secara lengkap, jelas, dan terstruktur.
- Jumlah tasks menyesuaikan banyaknya pekerjaan dalam instruksi.
- Jumlah rules menyesuaikan ketentuan yang ditemukan.
- Jumlah steps menyesuaikan tingkat kesulitan dan kompleksitas tugas.
- Jangan membatasi jumlah langkah secara tetap.
- Jangan menghilangkan pekerjaan penting hanya demi membuat hasil lebih singkat.
- Setiap langkah harus menjelaskan tindakan yang perlu dilakukan mahasiswa.

Kembalikan hasil dalam format JSON berikut:

{
  "summary": "Ringkasan tugas",
  "deadline": "Informasi tenggat atau string kosong",
  "tasks": [
    "Daftar pekerjaan yang harus dilakukan"
  ],
  "rules": [
    "Ketentuan tugas"
  ],
  "steps": [
    "Langkah 1: penjelasan tindakan secara konkret",
    "Langkah 2: penjelasan tindakan secara konkret"
  ]
}

Pastikan seluruh properti tersedia dan tipe datanya sesuai.
Jangan gunakan Markdown code fence.
`;

        // MENYIAPKAN KONTEN UNTUK GROQ
        const content = [
            {
                type: "text",
                text: text.trim()
                    ? `${prompt}\n\nINSTRUKSI TUGAS:\n${text}`
                    : prompt
            }
        ];

        // MEMPROSES FILE
        if (file) {
            if (file.mimetype === "text/plain") {
                content[0].text +=
                    "\n\nISI FILE TXT:\n" +
                    file.buffer.toString("utf-8");
            }

            // Mengirim gambar sebagai Base64
            else if (file.mimetype.startsWith("image/")) {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
                    }
                });
            }

            // PDF menggunakan teks hasil ekstraksi dari frontend
        }

        // MENGIRIM PERMINTAAN KE GROQ
        const response = await groq.chat.completions.create({
            model: "qwen/qwen3.8-27b",

            messages: [
                {
                    role: "user",
                    content
                }
            ],

            response_format: {
                type: "json_object"
            },

            reasoning_effort: "none",
            temperature: 0.2,
            max_completion_tokens: 1000
        });

        // MENGAMBIL HASIL GROQ
        const answer = response.choices[0]?.message?.content;

        if (!answer) {
            throw new Error("Groq tidak memberikan hasil analisis.");
        }

        const result = JSON.parse(answer);

        // VALIDASI HASIL ANALISIS
        if (
            !result ||
            typeof result.summary !== "string" ||
            typeof result.deadline !== "string" ||
            !Array.isArray(result.tasks) ||
            !Array.isArray(result.rules) ||
            !Array.isArray(result.steps)
        ) {
            throw new Error("Format hasil analisis Groq tidak sesuai.");
        }

        // MENGIRIM HASIL KE FRONTEND
        return res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("Groq Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Terjadi kesalahan saat menganalisis tugas."
        });
    }
});


// MENJALANKAN SERVER
app.listen(PORT, () => {
    console.log(`Taskly berjalan di http://localhost:${PORT}`);
});

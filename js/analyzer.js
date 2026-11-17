/* ANALISIS INSTRUKSI TUGAS SECARA LOKAL */

const VERBS = "buat|buatlah|jelaskan|analisis|analisislah|susun|susunlah|rancang|rancanglah|implementasikan|tulis|tuliskan|hitung|hitunglah|kerjakan|presentasikan|kumpulkan|unggah|upload|bandingkan|identifikasi|cari|carilah|diskusikan|simpulkan|lengkapi|sertakan|gunakan|siapkan|rangkum|uraikan|desain|kembangkan|uji|evaluasi|submit|write|create|explain|analyze|design|implement".split("|");

// [PERBAIKAN] Tambahan kata kerja (daftar asli di atas tidak diubah)
VERBS.push(
  "lakukan", "tentukan", "berikan", "kirim", "kirimkan", "tambahkan", "buatkan",
  "paparkan", "sebutkan", "pilih", "isi", "bahas", "bahaslah",
  "membuat", "menjelaskan", "menyusun", "menganalisis", "merancang",
  "membandingkan", "mengidentifikasi", "membahas", "mengumpulkan", "mempresentasikan"
);

// [PERBAIKAN] Pemicu deadline dan penanda waktu (supaya "dikumpulkan dalam format PDF" tidak dianggap deadline)
const DEADLINE_TRIGGER = /deadline|paling lambat|batas(?: waktu| pengumpulan)?|tenggat|dikumpulkan/i;

const TIME_MARK = /\b(?:senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|pukul|jam|tanggal|besok|hari ini|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b|\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?/i;

// [PERBAIKAN] Penanda kalimat ketentuan (jumlah halaman, format, durasi, dll)
const RULE_MARK = /\b(?:minimal|maksimal|maks|format|halaman|kata|slide|font|spasi|durasi|menit|referensi|sumber|jurnal)\b/i;


function analyze(text) {

  const clean = text.replace(/\s+/g, " ").trim();

  const sents = text
    .replace(/\r/g, "")
    .split (/\n+|(?<=[.!?])\s+/)
    // [PERBAIKAN] Hanya buang penomoran/bullet ("1.", "2)", "-", "•"), angka isi kalimat tetap
    .map(s => s.replace(/^\s*(?:[-•*]|\d{1,2}[.)])\s+/, "").trim())
    // [PERBAIKAN] Batas diturunkan supaya perintah pendek seperti "Buat PPT." tidak hilang
    .filter(s => s.length > 7);

  // Mendeteksi deadline
  // [PERBAIKAN] Cari per kalimat: harus ada pemicu DAN penanda waktu.
  // Tidak lagi berhenti di titik, jadi "23.59" dan "15.11.2026" utuh.
  let deadlineSent = "";
  let deadlineText = "";

  for (const s of sents) {

    const trig = s.match(DEADLINE_TRIGGER);

    if (trig && TIME_MARK.test(s)) {
      deadlineSent = s;
      deadlineText = s.slice(trig.index).replace(/[.;]$/, "").trim().slice(0, 120);
      break;
    }

  }

  // Dibuat array agar baris di bawah (dm[0]) tetap sama seperti kode asli
  const dm = deadlineText ? [deadlineText] : null;

  const tasks = [];

  // Mengambil instruksi pekerjaan
  sents.forEach(s => {

    // [PERBAIKAN] Tanda baca dibersihkan supaya "Buatlah," atau "Buat:" tetap terdeteksi
    const w = s.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);

    // [PERBAIKAN] Kalimat deadline tidak dimasukkan lagi ke daftar pekerjaan
    if (s === deadlineSent) return;

    if (
      VERBS.includes(w[0]) ||
      VERBS.includes(w[1] || "") ||
      /\b(harus|wajib|diminta|dikumpulkan)\b/i.test(s)
    ) {

      // [PERBAIKAN] Bandingkan setelah tanda baca akhir dibuang, supaya duplikat tertangkap
      const t = s.replace(/[.;]$/, "");

      if (!tasks.includes(t) && tasks.length < 8) {
        tasks.push(t);
      }

    }

  });

  // Jika tidak ada tugas terdeteksi
  if (!tasks.length) {
    sents.slice(0, 4).forEach(s => {
      tasks.push(s.replace(/[.;]$/, ""));
    });
  }

  // [PERBAIKAN] Mengambil ketentuan tugas (minimal halaman, format, durasi, dll)
  const rules = [];

  sents.forEach(s => {

    const t = s.replace(/[.;]$/, "");

    if (
      s !== deadlineSent &&
      RULE_MARK.test(s) &&
      !tasks.includes(t) &&
      !rules.includes(t) &&
      rules.length < 6
    ) {
      rules.push(t);
    }

  });

  // Membuat ringkasan
  const summary = sents.slice(0, 3).join(" ");

  // Membuat panduan pengerjaan
  const steps = [

    "Baca seluruh instruksi sampai selesai dan tandai kata kunci",

    "Kumpulkan bahan, referensi, dan peralatan yang dibutuhkan",

    ...tasks.map(t => "Kerjakan: " + t),

    // [PERBAIKAN] Ketentuan tampil sebagai langkah pengecekan (tanpa perlu ubah ui.js)
    ...rules.map(r => "Pastikan ketentuan terpenuhi: " + r),

    "Periksa hasil terhadap instruksi dan daftar pekerjaan",

    "Rapikan format, simpan, lalu kumpulkan" +
      (dm ? " (" + dm[0].trim() + ")" : "")

  ];

  return {
    summary: summary || clean.slice(0, 300),
    deadline: dm ? dm[0].trim() : "",
    tasks,
    rules,
    steps
  };

}
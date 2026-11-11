<<<<<<< HEAD

/* ANALISIS INSTRUKSI TUGAS SECARA LOKAL */

=======
  /* Analisis lokal. Titik sambung untuk NLP Hugging Face: ganti isi analyze() dengan panggilan model. */
>>>>>>> ed6afd35555083c82a0e1ad61b42fe21d1e559c3
const VERBS = "buat|buatlah|jelaskan|analisis|analisislah|susun|susunlah|rancang|rancanglah|implementasikan|tulis|tuliskan|hitung|hitunglah|kerjakan|presentasikan|kumpulkan|unggah|upload|bandingkan|identifikasi|cari|carilah|diskusikan|simpulkan|lengkapi|sertakan|gunakan|siapkan|rangkum|uraikan|desain|kembangkan|uji|evaluasi|submit|write|create|explain|analyze|design|implement".split("|");


function analyze(text) {

  const clean = text.replace(/\s+/g, " ").trim();

  const sents = text
    .replace(/\r/g, "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map(s => s.replace(/^[\s\-•*\d.)]+/, "").trim())
    .filter(s => s.length > 12);

  // Mendeteksi deadline
  const dm = clean.match(
    /(?:deadline|dikumpulkan|batas(?: waktu| pengumpulan)?|paling lambat|tenggat)[^.;\n]{0,80}/i
  );

  const tasks = [];

  // Mengambil instruksi pekerjaan
  sents.forEach(s => {

    const w = s.toLowerCase().split(/\s+/);

    if (
      VERBS.includes(w[0]) ||
      VERBS.includes(w[1] || "") ||
      /\b(harus|wajib|diminta|dikumpulkan)\b/i.test(s)
    ) {

      if (!tasks.includes(s) && tasks.length < 8) {
        tasks.push(s.replace(/[.;]$/, ""));
      }

    }

  });

  // Jika tidak ada tugas terdeteksi
  if (!tasks.length) {
    sents.slice(0, 4).forEach(s => {
      tasks.push(s.replace(/[.;]$/, ""));
    });
  }

  // Membuat ringkasan
  const summary = sents.slice(0, 3).join(" ");

  // Membuat panduan pengerjaan
  const steps = [

    "Baca seluruh instruksi sampai selesai dan tandai kata kunci",

    "Kumpulkan bahan, referensi, dan peralatan yang dibutuhkan",

    ...tasks.map(t => "Kerjakan: " + t),

    "Periksa hasil terhadap instruksi dan daftar pekerjaan",

    "Rapikan format, simpan, lalu kumpulkan" +
      (dm ? " (" + dm[0].trim() + ")" : "")

  ];

  return {
    summary: summary || clean.slice(0, 300),
    deadline: dm ? dm[0].trim() : "",
    tasks,
    steps
  };

}


/* ==========================================================================
   TASKLY - UPLOAD FILE
   Mendukung PDF, TXT, JPG, PNG, WEBP, klik, dan drag & drop
   ========================================================================== */

const drop = $("drop");
const file = $("file");

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PAGES = 30;

// Menyimpan file agar bisa dikirim ke backend Groq
let uploadedTaskFile = null;


/* --------------------------------------------------------------------------
   1. KLIK AREA UPLOAD
   -------------------------------------------------------------------------- */

drop.onclick = () => {
  file.click();
};


/* --------------------------------------------------------------------------
   2. AKSES KEYBOARD
   -------------------------------------------------------------------------- */

drop.onkeydown = e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    file.click();
  }
};


/* --------------------------------------------------------------------------
   3. DRAG AND DROP
   -------------------------------------------------------------------------- */

["dragover", "dragenter"].forEach(ev => {
  drop.addEventListener(ev, e => {
    e.preventDefault();
    drop.classList.add("on");
  });
});


["dragleave", "drop"].forEach(ev => {
  drop.addEventListener(ev, e => {
    e.preventDefault();
    drop.classList.remove("on");
  });
});


drop.addEventListener("drop", async e => {
  const selected = e.dataTransfer.files[0];

  if (selected) {
    await handle(selected);
  }
});


/* --------------------------------------------------------------------------
   4. PILIH FILE SECARA MANUAL
   -------------------------------------------------------------------------- */

file.onchange = async () => {
  const selected = file.files[0];

  if (selected) {
    await handle(selected);
  }

  // Reset supaya file yang sama dapat dipilih kembali
  file.value = "";
};


/* --------------------------------------------------------------------------
   5. FUNGSI UTAMA MEMBACA FILE
   -------------------------------------------------------------------------- */

async function handle(f) {

  uploadedTaskFile = null;

  $("dname").textContent = f.name;

  // VALIDASI UKURAN
  if (f.size > MAX_SIZE) {
    say(
      "File lebih dari 10 MB. Pilih file yang lebih kecil.",
      true
    );
    return;
  }

  // VALIDASI FORMAT
  const name = f.name.toLowerCase();

  const isPDF = name.endsWith(".pdf");
  const isTXT = name.endsWith(".txt");

  const isImage =
    /\.(png|jpg|jpeg|webp)$/i.test(name);

  if (!isPDF && !isTXT && !isImage) {
    say(
      "Format tidak didukung. Gunakan PDF, TXT, JPG, PNG, atau WEBP.",
      true
    );
    return;
  }

  try {

    say("Sedang membaca file...");

    let output = "";


    /* ----------------------------------------------------------------------
       6. MEMBACA PDF
       ---------------------------------------------------------------------- */

    if (isPDF) {

      // Simpan file PDF untuk dikirim ke backend Groq
      uploadedTaskFile = f;

      if (!window.pdfjsLib) {
        throw new Error("PDF.js tidak berhasil dimuat.");
      }

      const pdfDoc = await pdfjsLib.getDocument({
        data: await f.arrayBuffer()
      }).promise;

      const totalPages = Math.min(
        pdfDoc.numPages,
        MAX_PAGES
      );

      for (let i = 1; i <= totalPages; i++) {

        const page = await pdfDoc.getPage(i);

        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(" ");

        output += pageText + "\n";
      }

      if (pdfDoc.numPages > MAX_PAGES) {
        say("Hanya 30 halaman pertama yang dibaca.");
      }

      // Memasukkan teks PDF jika berhasil diekstrak
      if (output.trim().length >= 20) {
        $("txt").value = output.trim();
      }

    }


    /* ----------------------------------------------------------------------
       7. MEMBACA TXT
       ---------------------------------------------------------------------- */

    else if (isTXT) {

      output = await f.text();

      if (output.trim().length < 20) {
        throw new Error(
          "Teks tidak ditemukan atau terlalu pendek."
        );
      }

      $("txt").value = output.trim();
    }


    /* ----------------------------------------------------------------------
       8. MENERIMA GAMBAR
       ---------------------------------------------------------------------- */

    else if (isImage) {

      // Simpan gambar asli untuk dikirim ke Groq Vision
      uploadedTaskFile = f;

    }


    /* ----------------------------------------------------------------------
       9. MENAMPILKAN STATUS UPLOAD
       ---------------------------------------------------------------------- */

    $("dname").textContent = "✓ " + f.name;

    if (isImage) {
      say(
        "Gambar berhasil diunggah! Groq akan membaca isi gambar saat dianalisis."
      );
    } else if (isPDF && output.trim().length < 20) {
      say(
        "PDF berhasil diunggah. Teks akan dianalisis langsung oleh Groq."
      );
    } else {
      say(
        "File berhasil dibaca! Klik Analisis tugas untuk melanjutkan."
      );
    }

  } catch (error) {

    console.error("Upload error:", error);

    uploadedTaskFile = null;

    say(
      error.message || "File gagal dibaca. Periksa kembali file kamu.",
      true
    );

  }

}

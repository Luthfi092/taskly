
/* ==========================================================================
   TASKLY - UPLOAD FILE
   Mendukung PDF, TXT, klik, dan drag & drop
   ========================================================================== */

const drop = $("drop");
const file = $("file");

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PAGES = 30;


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

// Ketika file ditarik ke area upload

["dragover", "dragenter"].forEach(ev => {

  drop.addEventListener(ev, e => {

    e.preventDefault();

    drop.classList.add("on");

  });

});


// Ketika file keluar atau dilepaskan

["dragleave", "drop"].forEach(ev => {

  drop.addEventListener(ev, e => {

    e.preventDefault();

    drop.classList.remove("on");

  });

});


// Menerima file yang dilepaskan

drop.addEventListener("drop", e => {

  const selected = e.dataTransfer.files[0];

  if (selected) {

    handle(selected);

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

  // Menampilkan nama file

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


  if (!isPDF && !isTXT) {

    say(
      "Format tidak didukung. Gunakan file PDF atau TXT.",
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

      // Memeriksa PDF.js

      if (!window.pdfjsLib) {

        throw new Error("PDF.js tidak berhasil dimuat.");

      }


      // Membuka dokumen PDF

      const pdfDoc = await pdfjsLib.getDocument({

        data: await f.arrayBuffer()

      }).promise;


      // Membatasi pembacaan maksimal 30 halaman

      const totalPages = Math.min(
        pdfDoc.numPages,
        MAX_PAGES
      );


      // Membaca setiap halaman

      for (let i = 1; i <= totalPages; i++) {

        const page = await pdfDoc.getPage(i);

        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(" ");

        output += pageText + "\n";

      }


      if (pdfDoc.numPages > MAX_PAGES) {

        say(
          "Hanya 30 halaman pertama yang dibaca."
        );

      }

    }


    /* ----------------------------------------------------------------------
       7. MEMBACA TXT
       ---------------------------------------------------------------------- */

    else if (isTXT) {

      output = await f.text();

    }


    /* ----------------------------------------------------------------------
       8. VALIDASI HASIL PEMBACAAN
       ---------------------------------------------------------------------- */

    if (output.trim().length < 20) {

      throw new Error(
        "Teks tidak ditemukan atau terlalu pendek."
      );

    }


    /* ----------------------------------------------------------------------
       9. MEMASUKKAN TEKS KE TEXTAREA
       ---------------------------------------------------------------------- */

    $("txt").value = output.trim();

    $("dname").textContent = "✓ " + f.name;

    say(
      "File berhasil dibaca! Klik Analisis tugas untuk melanjutkan."
    );


  } catch (error) {

    console.error("Upload error:", error);

    say(
      "File gagal dibaca. Pastikan PDF berisi teks, bukan hasil scan gambar.",
      true
    );

  }

}

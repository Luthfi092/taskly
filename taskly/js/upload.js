/* ==========================================================================
   TASKLY - UPLOAD FILE
   Mendukung PDF, TXT, JPG, PNG, WEBP, klik, dan drag & drop
   ========================================================================== */

const drop = $("drop");
const file = $("file");
const preview = $("preview");

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PAGES = 30;

// Menyimpan file dan teks ekstrak agar bisa dikirim ke backend
let uploadedTaskFile = null;
let extractedFileText = "";

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function showPreview(f, ext) {
  preview.innerHTML = "";
  preview.hidden = false;

  const card = document.createElement("div");
  card.className = "fcard" + (f.type.startsWith("image/") ? " img" : "");

  const del = document.createElement("button");
  del.type = "button";
  del.className = "fdel";
  del.setAttribute("aria-label", "Batalkan file " + f.name);
  del.title = "Batalkan file";
  del.textContent = "×";
  del.onclick = e => {
    e.stopPropagation();
    clearUpload(true);
  };

  if (f.type.startsWith("image/")) {
    const img = document.createElement("img");
    const url = URL.createObjectURL(f);
    img.src = url;
    img.alt = f.name;
    img.onload = () => URL.revokeObjectURL(url);
    card.append(img, del);
  } else {
    const meta = document.createElement("div");

    const badge = document.createElement("span");
    badge.className = "fbadge";
    badge.textContent = ext.toUpperCase();

    const nameEl = document.createElement("div");
    nameEl.className = "fname";
    nameEl.title = f.name;
    nameEl.textContent = f.name;

    const sizeEl = document.createElement("div");
    sizeEl.className = "fsize";
    sizeEl.textContent = formatSize(f.size);

    meta.append(nameEl, sizeEl);
    card.append(badge, meta, del);
  }

  preview.appendChild(card);
}

function clearUpload(resetResultSection = false) {
  uploadedTaskFile = null;
  extractedFileText = "";
  file.value = "";
  preview.innerHTML = "";
  preview.hidden = true;

  if (resetResultSection) {
    store.clear();
    state = {
      text: "",
      summary: "",
      deadline: "",
      tasks: [],
      steps: [],
      done: []
    };
    $("result").style.display = "none";
  }

  say("");
}


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
  extractedFileText = "";
  preview.innerHTML = "";
  preview.hidden = true;

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
  const ext = name.includes(".") ? name.split(".").pop() : "file";

  const isPDF = name.endsWith(".pdf");
  const isTXT = name.endsWith(".txt");
  const isImage = /\.(png|jpg|jpeg|webp)$/i.test(name);

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
    let pageLimitNotice = false;

    if (isPDF) {
      if (!window.pdfjsLib) {
        throw new Error("PDF.js tidak berhasil dimuat.");
      }

      const pdfDoc = await pdfjsLib.getDocument({
        data: await f.arrayBuffer()
      }).promise;

      const totalPages = Math.min(pdfDoc.numPages, MAX_PAGES);
      pageLimitNotice = pdfDoc.numPages > MAX_PAGES;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        output += pageText + "\n";
      }

      if (output.trim().length > 0) {
        extractedFileText = output.trim();
      }
    } else if (isTXT) {
      output = await f.text();
      if (output.trim().length === 0) {
        throw new Error("Isi file TXT kosong.");
      }
      extractedFileText = output.trim();
    }

    uploadedTaskFile = f;
    showPreview(f, ext);

    if (pageLimitNotice) {
      say("Hanya 30 halaman pertama yang dibaca. Tulis instruksi jika perlu, lalu klik Analisis tugas.");
    } else {
      say("File siap! Boleh langsung klik Analisis tugas atau tulis instruksi tambahan di kolom teks.");
    }

  } catch (error) {

    console.error("Upload error:", error);

    uploadedTaskFile = null;
    extractedFileText = "";
    preview.innerHTML = "";
    preview.hidden = true;

    say(
      error.message || "File gagal dibaca. Periksa kembali file kamu.",
      true
    );

  }

}
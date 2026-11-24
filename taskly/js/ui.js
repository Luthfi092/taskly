/* ==========================================================================
   TASKLY - RENDER HASIL, PROGRES, DAN TOMBOL
   ========================================================================== */


/* --------------------------------------------------------------------------
1. ANALISIS TUGAS
   -------------------------------------------------------------------------- */

$("go").onclick = async () => {

  const t = $("txt").value.trim();
  const selectedFile = uploadedTaskFile;

  // Wajib ada file, atau minimal teks instruksi yang memadai jika tanpa file
  if (!selectedFile && t.length < 15) {
    say(
      "Tulis instruksi tugas terlebih dahulu atau unggah file PDF / Foto.",
      true
    );
    return;
  }

  $("go").disabled = true;

  say("Menganalisis tugas...");

  try {

    const r = await analyze(t, selectedFile);

    state = {
      text: t,
      ...r,
      done: r.steps.map(() => false)
    };

    store.set(state);

    render();

    say("");

    $("result").scrollIntoView({
      behavior: "smooth"
    });

  } catch (e) {

    console.error("Analisis error:", e);

    say(
      e.message || "Analisis gagal. Coba lagi beberapa saat.",
      true
    );

  } finally {

    $("go").disabled = false;

  }

};


/* --------------------------------------------------------------------------
2. TOMBOL CONTOH
   -------------------------------------------------------------------------- */

$("sample").onclick = () => {

  clearUpload(true);

  $("txt").value =
    "Buatlah sebuah makalah tentang dampak media sosial terhadap prestasi belajar mahasiswa. " +
    "Makalah minimal 8 halaman dengan format APA. " +
    "Jelaskan minimal tiga faktor yang memengaruhi dampak tersebut dan sertakan data pendukung dari jurnal. " +
    "Susun kesimpulan dan saran di bagian akhir. " +
    "Presentasikan hasilnya secara singkat di kelas. " +
    "Tugas dikumpulkan paling lambat hari Jumat pukul 23.59 melalui LMS.";

  say("Contoh dimuat. Klik Analisis tugas.");

};


/* --------------------------------------------------------------------------
3. RENDER HASIL ANALISIS
   -------------------------------------------------------------------------- */

function render() {

  $("result").style.display = "block";

  $("sum").textContent = state.summary;

  $("dl").textContent = state.deadline
    ? "Tenggat terdeteksi: " + state.deadline
    : "";

  $("tasks").innerHTML = "";

  state.tasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    $("tasks").appendChild(li);
  });

  $("steps").innerHTML = "";

  state.steps.forEach((s, i) => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    const lb = document.createElement("label");

    cb.type = "checkbox";
    cb.id = "s" + i;
    cb.checked = !!state.done[i];

    lb.htmlFor = cb.id;
    lb.textContent = s;

    li.className = cb.checked ? "done" : "";

    cb.onchange = () => {
      state.done[i] = cb.checked;
      li.className = cb.checked ? "done" : "";
      store.set(state);
      prog();
    };

    li.append(cb, lb);
    $("steps").appendChild(li);
  });

  prog();

}


/* --------------------------------------------------------------------------
4. PROGRESS BAR
   -------------------------------------------------------------------------- */

function prog() {

  const n = state.done.filter(Boolean).length;
  const t = state.done.length;
  const p = t ? Math.round(n / t * 100) : 0;

  $("fill").style.width = p + "%";

  $("pct").textContent =
    n + " dari " + t +
    " langkah selesai (" + p + "%)" +
    (p === 100 ? " – semua selesai!" : "");

}


/* --------------------------------------------------------------------------
5. RESET CHECKLIST
   -------------------------------------------------------------------------- */

$("reset").onclick = () => {

  state.done = state.steps.map(() => false);
  store.set(state);
  render();

};


/* --------------------------------------------------------------------------
6. INISIALISASI HALAMAN KOSONG SAAT PERTAMA DIBUKA
   -------------------------------------------------------------------------- */

store.clear();
$("txt").value = "";
$("result").style.display = "none";


/* --------------------------------------------------------------------------
7. TUGAS BARU
   -------------------------------------------------------------------------- */

$("newtask").onclick = () => {

  clearUpload(true);
  $("txt").value = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};
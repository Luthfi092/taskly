
/* ==========================================================================
   TASKLY - RENDER HASIL, PROGRES, DAN TOMBOL
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. ANALISIS TUGAS
   -------------------------------------------------------------------------- */

$("go").onclick = async () => {

  const t = $("txt").value.trim();

  if (t.length < 30) {

    say(
      "Instruksi terlalu pendek. Unggah file atau tempel teks tugas yang lengkap.",
      true
    );

    return;

  }

  $("go").disabled = true;

  say("Menganalisis...");

  try {

    const r = await analyze(t);

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

    console.error(e);

    say(
      "Analisis gagal. Coba lagi beberapa saat.",
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

  $("txt").value =
    "Buatlah sebuah makalah tentang dampak media sosial terhadap prestasi belajar mahasiswa. " +
    "Makalah minimal 8 halaman dengan format APA. " +
    "Jelaskan minimal tiga faktor yang memengaruhi dampak tersebut dan sertakan data pendukung dari jurnal. " +
    "Susun kesimpulan dan saran di bagian akhir. " +
    "Presentasikan hasilnya secara singkat di kelas. " +
    "Tugas dikumpulkan paling lambat hari Jumat pukul 23.59 melalui LMS.";

  $("dname").textContent = "";

  say("Contoh dimuat. Klik Analisis tugas.");

};


/* --------------------------------------------------------------------------
   3. RENDER HASIL ANALISIS
   -------------------------------------------------------------------------- */

function render() {

  $("result").style.display = "block";


  // Ringkasan

  $("sum").textContent = state.summary;


  // Deadline

  $("dl").textContent = state.deadline
    ? "Tenggat terdeteksi: " + state.deadline
    : "";


  // Daftar pekerjaan

  $("tasks").innerHTML = "";

  state.tasks.forEach(t => {

    const li = document.createElement("li");

    li.textContent = t;

    $("tasks").appendChild(li);

  });


  // Panduan pengerjaan

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


    // Event checkbox

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

  const p = t
    ? Math.round(n / t * 100)
    : 0;


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
   6. MUAT DATA TERSIMPAN
   -------------------------------------------------------------------------- */

const saved = store.get();

if (
  saved &&
  saved.steps &&
  Array.isArray(saved.steps) &&
  saved.steps.length
) {

  state = saved;

  $("txt").value = state.text || "";

  render();

  say("Progres terakhirmu dimuat dari browser ini.");

}


/* --------------------------------------------------------------------------
   7. TUGAS BARU
   -------------------------------------------------------------------------- */

$("newtask").onclick = () => {

  store.clear();

  state = {
    text: "",
    summary: "",
    deadline: "",
    tasks: [],
    steps: [],
    done: []
  };

  $("txt").value = "";

  $("dname").textContent = "";

  $("result").style.display = "none";

  file.value = "";

  say("");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};


/* STATE GLOBAL, HELPER DOM, DAN LOCAL STORAGE */

const $ = id => document.getElementById(id);

const KEY = "taskly:v1";

let state = {
  text: "",
  summary: "",
  deadline: "",
  tasks: [],
  steps: [],
  done: []
};

const store = {

  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  },

  set(v) {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch (e) {
      console.error("Gagal menyimpan data:", e);
    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.error("Gagal menghapus data:", e);
    }
  }

};

/* PESAN STATUS */

function say(t, bad = false) {
  $("msg").textContent = t;

  $("msg").className = "msg" + (bad ? " err" : "");
}


/* ANALISIS INSTRUKSI TUGAS MENGGUNAKAN GEMINI */

async function analyze(text, uploadedFile = null) {

    // Membuat FormData untuk mengirim teks dan file
    const formData = new FormData();

    formData.append("text", text || "");

    if (uploadedFile) {
        formData.append("file", uploadedFile);
    }

    const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Gagal menganalisis tugas."
        );
    }

    const result = data.result;

    if (
        !result ||
        !Array.isArray(result.tasks) ||
        !Array.isArray(result.steps)
    ) {
        throw new Error(
            "Format hasil analisis Gemini tidak valid."
        );
    }

    return {
        summary: result.summary || "",
        deadline: result.deadline || "",
        tasks: result.tasks,
        rules: Array.isArray(result.rules) ? result.rules : [],
        steps: result.steps
    };
}

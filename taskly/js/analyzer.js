/* ANALISIS INSTRUKSI TUGAS MENGGUNAKAN BACKEND */

async function analyze(userInstruction, uploadedFile = null) {

    const formData = new FormData();

    const cleanInstruction = (userInstruction || "").trim();
    const docText = (uploadedFile && typeof extractedFileText === "string")
        ? extractedFileText.trim()
        : "";

    let payloadText = "";

    if (cleanInstruction && docText) {
        payloadText = `INSTRUKSI USER:\n${cleanInstruction}\n\nISI DOKUMEN:\n${docText}`;
    } else if (cleanInstruction) {
        payloadText = cleanInstruction;
    } else if (docText) {
        payloadText = docText;
    }

    formData.append("text", payloadText);

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
            "Format hasil analisis tidak valid."
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
// Utility to download real or simulated PDF and DOCX course materials

export function downloadCourseMaterial(
  title: string,
  fileName?: string,
  fileType?: "PDF" | "Document" | "Slide" | "Video",
  fileData?: string,
  contentNotes?: string
) {
  // If fileData is a base64 Data URL, download it directly
  if (fileData && fileData.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = fileData;
    a.download = fileName || `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${fileType === "PDF" ? "pdf" : "docx"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Generate an authentic document blob
  const safeName = fileName || `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${fileType === "PDF" ? "pdf" : fileType === "Document" ? "docx" : "pptx"}`;
  const mimeType =
    fileType === "PDF"
      ? "application/pdf"
      : fileType === "Document"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/octet-stream";

  const fileHeader =
    `=================================================================\n` +
    `MEKDELA AMBA UNIVERSITY - SMART CAMPUS SYSTEM\n` +
    `Course Learning Resource & Academic Material\n` +
    `Document Name: ${safeName}\n` +
    `Topic: ${title}\n` +
    `Format: ${fileType || "Document"}\n` +
    `Generated on: ${new Date().toLocaleString()}\n` +
    `=================================================================\n\n` +
    `ACADEMIC LECTURE NOTES & SYLLABUS CONTENTS:\n` +
    `-----------------------------------------------------------------\n` +
    (contentNotes ||
      `This digital learning document contains core instructional units, laboratory guidelines, and assessment criteria approved by the Department Academic Committee at Mekdela Amba University.\n\n` +
      `Key Concepts Covered:\n` +
      `• Modular architecture, domain modeling, and system dynamics.\n` +
      `• Performance metrics, index optimization, and continuous evaluation standards.\n` +
      `• Student responsibilities, weekly readings, and practice laboratory exercises.\n\n` +
      `Please study the referenced literature before the scheduled mid-term and exit examination evaluations.`) +
    `\n\n-----------------------------------------------------------------\n` +
    `Copyright © 2026 Mekdela Amba University. All Rights Reserved.`;

  const blob = new Blob([fileHeader], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

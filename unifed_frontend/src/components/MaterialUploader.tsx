import { useState, useRef } from "react";
import { Upload, FileText, Loader2, X, CheckCircle2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedPDF {
  fileName: string;
  pages: { pageNumber: number; text: string }[];
  fullText: string;
}

interface MaterialUploaderProps {
  onExtracted: (data: ExtractedPDF) => void;
  onClear: () => void;
}

export function MaterialUploader({ onExtracted, onClear }: MaterialUploaderProps) {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedPDF | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPDF = async (file: File) => {
    setExtracting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: { pageNumber: number; text: string }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();
        if (text) pages.push({ pageNumber: i, text });
      }

      const fullText = pages
        .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
        .join("\n\n");

      const result: ExtractedPDF = { fileName: file.name, pages, fullText };
      setExtracted(result);
      onExtracted(result);
    } catch (err: any) {
      console.error("PDF extraction failed:", err);
      setError("Could not read this PDF. It may be scanned or corrupted.");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractPDF(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") extractPDF(file);
    else setError("Only PDF files are supported.");
  };

  const handleClear = () => {
    setExtracted(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  if (extracted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-900 truncate">{extracted.fileName}</p>
            <p className="text-[10px] text-emerald-700">{extracted.pages.length} pages extracted</p>
          </div>
        </div>
        <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-primary transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {extracting ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-slate-600">Extracting text...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <Upload className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">Upload a PDF lecture note</p>
            <p className="text-[10px] text-slate-500">Drag & drop or click to select</p>
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
      {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
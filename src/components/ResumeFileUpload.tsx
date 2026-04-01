import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";

interface ResumeFileUploadProps {
  onFileSelected: (file: File) => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export function ResumeFileUpload({
  onFileSelected,
  loading = false,
  error,
  success = false,
}: ResumeFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ".pdf,.doc,.docx,.txt";
  const maxSize = 10 * 1024 * 1024; // 10MB

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function validateFile(file: File): string | null {
    const validExtensions = ["pdf", "doc", "docx", "txt"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return "Invalid file format. Please upload PDF, DOCX, or TXT file.";
    }

    if (file.size > maxSize) {
      return "File size exceeds 10MB limit.";
    }

    return null;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);
      if (!validation) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);
      if (!validation) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleClear() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : success
              ? "border-green-500/30 bg-green-500/5"
              : error
                ? "border-red-500/30 bg-red-500/5"
                : "border-slate-600 bg-slate-800/40 hover:border-slate-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={loading}
        />

        {!selectedFile ? (
          <>
            <Upload className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-100">
              Drag & drop your resume here
            </p>
            <p className="mt-1 text-xs text-slate-400">
              or click to browse (PDF, DOCX, TXT • Max 10MB)
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
                  <span className="text-sm text-slate-300">Analyzing your resume...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-400">
                    Resume analyzed successfully
                  </span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-400">Error parsing resume</span>
                </>
              ) : (
                <>
                  <File className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-slate-200">{selectedFile.name}</span>
                </>
              )}
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}

            {!loading && !success && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="mt-2 text-xs text-slate-400 hover:text-slate-300 underline"
              >
                Choose different file
              </button>
            )}
          </>
        )}
      </div>

      {selectedFile && success && (
        <p className="mt-2 text-xs text-green-400">
          ✓ File ready. Click below to improve your resume with AI
        </p>
      )}
    </motion.div>
  );
}

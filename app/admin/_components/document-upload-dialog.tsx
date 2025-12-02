// app/admin/_components/document-upload-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { FileUp, Upload, X, FileText, Image, File } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createDocument } from "../documents/_actions/document-actions";
import { documentTypeLabels, type DocumentType } from "@/lib/document-types";

// ========================================
// Types
// ========================================

type DocumentUploadDialogProps = {
  employeeId: string;
  employeeName: string;
};

type UploadResult = {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
};

// ========================================
// Helpers
// ========================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(format: string) {
  const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
  const docFormats = ["pdf", "doc", "docx"];

  if (imageFormats.includes(format.toLowerCase())) {
    return <Image className="h-5 w-5 text-blue-500" />;
  }
  if (docFormats.includes(format.toLowerCase())) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

// ========================================
// Component
// ========================================

export function DocumentUploadDialog({
  employeeId,
  employeeName,
}: DocumentUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [docType, setDocType] = React.useState<DocumentType>("ID_CARD");
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadResult[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  function handleUploadSuccess(result: CloudinaryUploadWidgetResults) {
    if (result.info && typeof result.info !== "string") {
      const info = result.info as UploadResult;
      setUploadedFiles((prev) => [...prev, info]);
    }
  }

  function removeFile(publicId: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.public_id !== publicId));
  }

  async function handleSaveDocuments() {
    if (uploadedFiles.length === 0) return;

    setIsSaving(true);

    try {
      for (const file of uploadedFiles) {
        await createDocument({
          employeeId,
          docType,
          fileUrl: file.secure_url,
          publicId: file.public_id,
          uploadedBy: "MANAGER",
        });
      }

      setOpen(false);
      setUploadedFiles([]);
      setDocType("ID_CARD");
      router.refresh();
    } catch (error) {
      console.error("Failed to save documents:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset state when closing
      setUploadedFiles([]);
      setDocType("ID_CARD");
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileUp className="ml-2 h-4 w-4" />
          העלאת מסמך
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>העלאת מסמך עבור {employeeName}</DialogTitle>
          <DialogDescription>
            העלה מסמכים כגון תעודת זהות, הסכם עבודה, טופס 101 ועוד.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Type Select */}
          <div className="space-y-2">
            <Label>סוג מסמך</Label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג מסמך" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Widget */}
          <div className="space-y-2">
            <Label>קובץ</Label>
            <CldUploadWidget
              signatureEndpoint="/api/sign-cloudinary-params"
              options={{
                folder: `attendance-app/documents/${employeeId}`,
                resourceType: "auto",
                maxFiles: 5,
                clientAllowedFormats: [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "heic",
                  "pdf",
                  "doc",
                  "docx",
                ],
                maxFileSize: 10000000, // 10MB
                sources: ["local", "camera"],
                language: "he",
                text: {
                  he: {
                    or: "או",
                    menu: {
                      files: "מהמחשב",
                      camera: "מצלמה",
                    },
                    local: {
                      browse: "בחר קבצים",
                      dd_title_single: "גרור קובץ לכאן",
                      dd_title_multi: "גרור קבצים לכאן",
                    },
                  },
                },
              }}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                >
                  <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                  <span className="text-sm font-medium">לחץ להעלאת קבצים</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    או גרור קבצים לכאן
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">
                    תמונות, PDF, Word (עד 10MB)
                  </span>
                </button>
              )}
            </CldUploadWidget>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>קבצים שהועלו</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.public_id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.format)}
                      <div>
                        <p className="text-sm font-medium">
                          {file.original_filename}.{file.format}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.bytes)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.public_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Type Badge */}
          {uploadedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">יישמרו כ:</span>
              <Badge variant="secondary">{documentTypeLabels[docType]}</Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleSaveDocuments}
              disabled={uploadedFiles.length === 0 || isSaving}
            >
              {isSaving ? "שומר..." : `שמור ${uploadedFiles.length} מסמכים`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

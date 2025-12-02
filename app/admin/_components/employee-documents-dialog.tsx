// app/admin/_components/employee-documents-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image,
  File,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
} from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getEmployeeDocuments,
  deleteDocument,
  updateDocumentVisibility,
} from "../documents/_actions/document-actions";
import { documentTypeLabels, type DocumentType } from "@/lib/document-types";
import { DocumentUploadDialog } from "./document-upload-dialog";

// ========================================
// Types
// ========================================

type Document = {
  id: string;
  docType: string;
  fileUrl: string;
  visibility: "EMPLOYER_ONLY" | "EMPLOYEE_CAN_SEE";
  uploadedBy: "EMPLOYEE" | "MANAGER";
  createdAt: Date;
};

type EmployeeDocumentsDialogProps = {
  employeeId: string;
  employeeName: string;
};

// ========================================
// Helpers
// ========================================

function getFileIcon(url: string) {
  const extension = url.split(".").pop()?.toLowerCase() || "";
  const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
  const docFormats = ["pdf"];

  if (imageFormats.some((f) => url.includes(f))) {
    return <Image className="h-5 w-5 text-blue-500" />;
  }
  if (docFormats.some((f) => url.includes(f))) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ========================================
// Component
// ========================================

export function EmployeeDocumentsDialog({
  employeeId,
  employeeName,
}: EmployeeDocumentsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  async function loadDocuments() {
    setIsLoading(true);
    try {
      const docs = await getEmployeeDocuments(employeeId);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, employeeId]);

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }

  async function toggleVisibility(doc: Document) {
    const newVisibility =
      doc.visibility === "EMPLOYER_ONLY" ? "EMPLOYEE_CAN_SEE" : "EMPLOYER_ONLY";
    try {
      await updateDocumentVisibility(doc.id, newVisibility);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, visibility: newVisibility } : d
        )
      );
    } catch (error) {
      console.error("Failed to update visibility:", error);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <FolderOpen className="ml-2 h-4 w-4" />
            מסמכים
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>מסמכים - {employeeName}</DialogTitle>
            <DialogDescription>
              צפייה וניהול מסמכים של העובד
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <DocumentUploadDialog
              employeeId={employeeId}
              employeeName={employeeName}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                אין מסמכים לעובד זה
              </p>
              <p className="text-xs text-muted-foreground/70">
                לחץ על &quot;העלאת מסמך&quot; להוספת מסמך חדש
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.fileUrl)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {documentTypeLabels[doc.docType as DocumentType] ||
                              doc.docType}
                          </p>
                          <Badge
                            variant={
                              doc.visibility === "EMPLOYEE_CAN_SEE"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {doc.visibility === "EMPLOYEE_CAN_SEE"
                              ? "גלוי לעובד"
                              : "מנהל בלבד"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.createdAt)} •{" "}
                          {doc.uploadedBy === "MANAGER"
                            ? "הועלה ע״י מנהל"
                            : "הועלה ע״י העובד"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(doc)}
                        title={
                          doc.visibility === "EMPLOYEE_CAN_SEE"
                            ? "הסתר מעובד"
                            : "הצג לעובד"
                        }
                      >
                        {doc.visibility === "EMPLOYEE_CAN_SEE" ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="פתח בחלון חדש"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(doc.id)}
                        className="text-destructive hover:text-destructive"
                        title="מחק"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המסמך? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

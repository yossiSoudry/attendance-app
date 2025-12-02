// app/admin/documents/_actions/document-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Visibility, UploadedBy } from "@prisma/client";
import type { DocumentType } from "@/lib/document-types";

// ========================================
// Types
// ========================================

type CreateDocumentInput = {
  employeeId: string;
  docType: DocumentType;
  fileUrl: string;
  publicId: string; // Cloudinary public_id for deletion
  visibility?: Visibility;
  uploadedBy: UploadedBy;
};

// ========================================
// Actions
// ========================================

export async function createDocument(input: CreateDocumentInput) {
  try {
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: input.employeeId,
        docType: input.docType,
        fileUrl: input.fileUrl,
        visibility: input.visibility ?? "EMPLOYER_ONLY",
        uploadedBy: input.uploadedBy,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/documents");
    return { success: true, document };
  } catch (error) {
    console.error("Failed to create document:", error);
    return { success: false, error: "אירעה שגיאה בשמירת המסמך" };
  }
}

export async function deleteDocument(id: string) {
  try {
    // Get document to get the fileUrl for Cloudinary deletion
    const document = await prisma.employeeDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return { success: false, error: "מסמך לא נמצא" };
    }

    // Delete from database
    await prisma.employeeDocument.delete({
      where: { id },
    });

    // Note: For Cloudinary deletion, we would need to call the Cloudinary API
    // This should be done via an API route since cloudinary SDK needs server-side

    revalidatePath("/admin");
    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { success: false, error: "אירעה שגיאה במחיקת המסמך" };
  }
}

export async function updateDocumentVisibility(
  id: string,
  visibility: Visibility
) {
  try {
    await prisma.employeeDocument.update({
      where: { id },
      data: { visibility },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error) {
    console.error("Failed to update document visibility:", error);
    return { success: false, error: "אירעה שגיאה בעדכון הרשאות המסמך" };
  }
}

export async function getEmployeeDocuments(employeeId: string) {
  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });

  return documents;
}

export async function getAllDocuments() {
  const documents = await prisma.employeeDocument.findMany({
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return documents;
}

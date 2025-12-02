// app/admin/documents/_actions/document-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrganizationId } from "@/lib/auth";
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
  const organizationId = await requireOrganizationId();

  try {
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: input.employeeId,
        docType: input.docType,
        fileUrl: input.fileUrl,
        visibility: input.visibility ?? "EMPLOYER_ONLY",
        uploadedBy: input.uploadedBy,
        organizationId,
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
  const organizationId = await requireOrganizationId();

  try {
    // Get document to verify organization ownership
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id,
        organizationId,
      },
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
  const organizationId = await requireOrganizationId();

  try {
    // Verify document belongs to this organization
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!document) {
      return { success: false, error: "מסמך לא נמצא" };
    }

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
  const organizationId = await requireOrganizationId();

  const documents = await prisma.employeeDocument.findMany({
    where: {
      employeeId,
      organizationId,
    },
    orderBy: { createdAt: "desc" },
  });

  return documents;
}

export async function getAllDocuments() {
  const organizationId = await requireOrganizationId();

  const documents = await prisma.employeeDocument.findMany({
    where: {
      organizationId,
    },
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

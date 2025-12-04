// app/platform/_components/platform-admins-table.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { deletePlatformAdmin } from "../_actions/platform-admin-actions";
import { EditPlatformAdminDialog } from "./edit-platform-admin-dialog";

interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface PlatformAdminsTableProps {
  admins: PlatformAdmin[];
  currentAdminId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PlatformAdminsTable({ admins, currentAdminId }: PlatformAdminsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<PlatformAdmin | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<PlatformAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!adminToDelete) return;

    setIsDeleting(true);
    const result = await deletePlatformAdmin(adminToDelete.id);
    setIsDeleting(false);

    if (!result.success) {
      alert(result.error);
    }

    setDeleteDialogOpen(false);
    setAdminToDelete(null);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">מנהל</TableHead>
            <TableHead className="text-right">אימייל</TableHead>
            <TableHead className="text-right">תאריך יצירה</TableHead>
            <TableHead className="text-right w-[70px]">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs">
                      {getInitials(admin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{admin.name}</span>
                    {admin.id === currentAdminId && (
                      <Badge variant="secondary" className="text-xs">אתה</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{admin.email}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(admin.createdAt), "d בMMMM yyyy", { locale: he })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setAdminToEdit(admin);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="ml-2 h-4 w-4" />
                      ערוך
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={admin.id === currentAdminId}
                      onClick={() => {
                        setAdminToDelete(admin);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      מחק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המנהל {adminToDelete?.name} לצמיתות.
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "מוחק..." : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {adminToEdit && (
        <EditPlatformAdminDialog
          admin={adminToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
}

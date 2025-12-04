"use client";

import { useState, useTransition } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { he } from "date-fns/locale";
import { Copy, Loader2, Trash2, Clock, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteInvitation } from "../_actions/admin-actions";
import type { AdminRole } from "@prisma/client";

interface Invitation {
  id: string;
  email: string;
  role: AdminRole;
  departmentId: string | null;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
}

const roleLabels: Record<AdminRole, string> = {
  OWNER: "סופר אדמין",
  ADMIN: "מנהל מערכת",
  MANAGER: "מנהל מחלקה",
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין הזמנות ממתינות
      </div>
    );
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/admin/register?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleDelete() {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteInvitation(deleteId);
      if (!result.success) {
        alert(result.message);
      }
      setDeleteId(null);
    });
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>אימייל</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead>תוקף</TableHead>
              <TableHead>נוצר</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const isExpired = isPast(new Date(invitation.expiresAt));

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" />
                        פג תוקף
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(invitation.expiresAt), {
                          locale: he,
                          addSuffix: true,
                        })}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(invitation.createdAt), "d בMMM yyyy", {
                      locale: he,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyInviteLink(invitation.token)}
                        disabled={isExpired}
                        title="העתק קישור"
                      >
                        <Copy className="size-4" />
                      </Button>
                      {copied === invitation.token && (
                        <span className="text-xs text-green-600">הועתק!</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(invitation.id)}
                        className="text-destructive hover:text-destructive"
                        title="מחק הזמנה"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הזמנה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק הזמנה זו? הקישור יפסיק לעבוד.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

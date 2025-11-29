"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Loader2,
} from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deactivateAdmin,
  reactivateAdmin,
  updateAdminRole,
} from "../_actions/admin-actions";
import type { AdminRole, AdminStatus } from "@prisma/client";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  googleId: string | null;
  image: string | null;
  invitedAt: Date | null;
  invitedBy: {
    name: string;
    email: string;
  } | null;
  createdAt: Date;
}

interface AdminsTableProps {
  admins: Admin[];
  currentUserId: string;
  currentUserRole: AdminRole;
}

const roleLabels: Record<AdminRole, string> = {
  OWNER: "בעל המערכת",
  ADMIN: "מנהל מערכת",
  MANAGER: "מנהל מחלקה",
};

const roleIcons: Record<AdminRole, typeof Shield> = {
  OWNER: ShieldAlert,
  ADMIN: ShieldCheck,
  MANAGER: Shield,
};

const roleColors: Record<AdminRole, string> = {
  OWNER: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ADMIN: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  MANAGER: "bg-green-500/10 text-green-600 border-green-500/20",
};

export function AdminsTable({ admins, currentUserId, currentUserRole }: AdminsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionAdminId, setActionAdminId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "deactivate" | "reactivate" | "changeRole";
    adminId: string;
    adminName: string;
    newRole?: AdminRole;
  } | null>(null);

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "OWNER";

  function handleDeactivate(admin: Admin) {
    setConfirmDialog({
      type: "deactivate",
      adminId: admin.id,
      adminName: admin.name,
    });
  }

  function handleReactivate(admin: Admin) {
    setConfirmDialog({
      type: "reactivate",
      adminId: admin.id,
      adminName: admin.name,
    });
  }

  function handleRoleChange(admin: Admin, newRole: AdminRole) {
    setConfirmDialog({
      type: "changeRole",
      adminId: admin.id,
      adminName: admin.name,
      newRole,
    });
  }

  function executeAction() {
    if (!confirmDialog) return;

    setActionAdminId(confirmDialog.adminId);
    startTransition(async () => {
      let result;

      switch (confirmDialog.type) {
        case "deactivate":
          result = await deactivateAdmin(confirmDialog.adminId);
          break;
        case "reactivate":
          result = await reactivateAdmin(confirmDialog.adminId);
          break;
        case "changeRole":
          result = await updateAdminRole(confirmDialog.adminId, confirmDialog.newRole!);
          break;
      }

      if (!result.success) {
        alert(result.message);
      }

      setActionAdminId(null);
      setConfirmDialog(null);
    });
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead>מחלקה</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>הצטרף</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => {
              const RoleIcon = roleIcons[admin.role];
              const isSelf = admin.id === currentUserId;
              const isLoading = isPending && actionAdminId === admin.id;

              return (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {admin.image ? (
                        <img
                          src={admin.image}
                          alt={admin.name}
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {admin.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {admin.name}
                          {isSelf && (
                            <Badge variant="outline" className="text-xs">
                              אתה
                            </Badge>
                          )}
                        </div>
                        {admin.googleId && (
                          <span className="text-xs text-muted-foreground">
                            מחובר עם Google
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={roleColors[admin.role]}
                    >
                      <RoleIcon className="size-3 ml-1" />
                      {roleLabels[admin.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.department?.name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={admin.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {admin.status === "ACTIVE" ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(admin.createdAt), "d בMMM yyyy", { locale: he })}
                  </TableCell>
                  <TableCell>
                    {canManage && !isSelf && admin.role !== "OWNER" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="size-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(admin, "ADMIN")}
                                disabled={admin.role === "ADMIN"}
                              >
                                <ShieldCheck className="size-4" />
                                הפוך למנהל מערכת
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(admin, "MANAGER")}
                                disabled={admin.role === "MANAGER"}
                              >
                                <Shield className="size-4" />
                                הפוך למנהל מחלקה
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {admin.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(admin)}
                              className="text-destructive"
                            >
                              <UserX className="size-4" />
                              השבת חשבון
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleReactivate(admin)}
                            >
                              <UserCheck className="size-4" />
                              הפעל חשבון
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === "deactivate" && "השבתת חשבון"}
              {confirmDialog?.type === "reactivate" && "הפעלת חשבון"}
              {confirmDialog?.type === "changeRole" && "שינוי תפקיד"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "deactivate" &&
                `האם אתה בטוח שברצונך להשבית את החשבון של ${confirmDialog.adminName}? המשתמש לא יוכל להתחבר למערכת.`}
              {confirmDialog?.type === "reactivate" &&
                `האם אתה בטוח שברצונך להפעיל מחדש את החשבון של ${confirmDialog.adminName}?`}
              {confirmDialog?.type === "changeRole" &&
                `האם אתה בטוח שברצונך לשנות את התפקיד של ${confirmDialog.adminName} ל-${roleLabels[confirmDialog.newRole!]}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={
                confirmDialog?.type === "deactivate"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDialog?.type === "deactivate" && "השבת"}
              {confirmDialog?.type === "reactivate" && "הפעל"}
              {confirmDialog?.type === "changeRole" && "שנה תפקיד"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

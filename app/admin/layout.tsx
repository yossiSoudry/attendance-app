// app/admin/layout.tsx
import { AdminLayoutWrapper } from "./_components/admin-layout-wrapper";
import { getOrganizationInfo } from "./_actions/dashboard-actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch organization info for the sidebar
  let organization = null;
  try {
    organization = await getOrganizationInfo();
  } catch {
    // User might not be authenticated yet, ignore error
  }

  return (
    <AdminLayoutWrapper organization={organization}>
      {children}
    </AdminLayoutWrapper>
  );
}

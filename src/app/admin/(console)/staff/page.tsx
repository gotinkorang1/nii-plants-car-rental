import Link from "next/link";

import { InviteStaffForm } from "@/components/admin/staff/invite-staff-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { STAFF_ROLE_LABELS } from "@/lib/auth/roles";
import { inviteStaffAction } from "@/lib/staff/admin-actions";
import { STAFF_MANAGE_ROLES } from "@/lib/staff/permissions";
import { listStaffProfiles } from "@/lib/staff/queries";

export default async function AdminStaffPage() {
  await requireRole(STAFF_MANAGE_ROLES);
  const staff = await listStaffProfiles();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Staff"
        description="Invite operators, set roles, and deactivate accounts. Only administrators can manage staff."
      />
      {staff.length === 0 ? (
        <p className="text-sm text-muted-foreground">No staff profiles yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id}>
                <TableCell>{person.displayName}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{STAFF_ROLE_LABELS[person.role]}</TableCell>
                <TableCell>
                  <Badge variant={person.active ? "secondary" : "outline"}>
                    {person.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/staff/${person.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Invite staff</h2>
        <InviteStaffForm action={inviteStaffAction} />
      </section>
    </div>
  );
}

import {
  requestPasswordResetAction,
  updateEmployeeRoleAction,
} from "@/app/actions/hr";
import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  Panel,
  PrimaryButton,
  roleLabels,
  SelectInput,
} from "./_components";
import { getAdminUserRows } from "@/lib/hr/admin-data";
import type { Role } from "@/lib/hr/types";

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "master_admin", label: "Admin" },
];

export default async function AdminUsersPage() {
  const users = await getAdminUserRows();

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users and Roles" />

      <div className="mt-6 grid gap-5">
        <Panel icon="people" title="Employee Access">
          <div className="mt-5 overflow-x-auto">
            {users.length > 0 ? (
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-3 pr-4 font-semibold">Employee</th>
                    <th className="py-3 pr-4 font-semibold">Email</th>
                    <th className="py-3 pr-4 font-semibold">Team</th>
                    <th className="py-3 pr-4 font-semibold">Manager</th>
                    <th className="py-3 pr-4 font-semibold">Role</th>
                    <th className="py-3 pr-4 font-semibold">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr className="border-b border-zinc-100 last:border-0" key={user.id}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          {user.profilePhotoUrl ? (
                            <img
                              alt=""
                              className="size-10 rounded-lg object-cover"
                              src={user.profilePhotoUrl}
                            />
                          ) : (
                            <InitialsAvatar name={user.name} />
                          )}
                          <div>
                            <p className="font-semibold text-zinc-950">{user.name}</p>
                            <p className="text-xs text-zinc-500">{user.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-zinc-600">{user.email}</td>
                      <td className="py-4 pr-4 text-zinc-600">
                        <p>{user.department}</p>
                        <p className="text-xs text-zinc-500">{user.location}</p>
                      </td>
                      <td className="py-4 pr-4 text-zinc-600">{user.managerName}</td>
                      <td className="py-4 pr-4">
                        <form action={updateEmployeeRoleAction} className="flex items-center gap-2">
                          <input name="employeeId" type="hidden" value={user.id} />
                          <SelectInput
                            aria-label={`Role for ${user.name}`}
                            defaultValue={user.role}
                            name="role"
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectInput>
                          <button className="h-10 rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-700">
                            Save
                          </button>
                        </form>
                        <p className="mt-1 text-xs text-zinc-500">{roleLabels[user.role]}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <form action={requestPasswordResetAction}>
                          <input name="employeeId" type="hidden" value={user.id} />
                          <PrimaryButton>Reset Password</PrimaryButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState>No employees found.</EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

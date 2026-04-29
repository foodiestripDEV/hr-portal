import type {
  DocumentRecord,
  EmployeeRecord,
  LeaveRequestRecord,
  Role,
  RoleSlug,
  Viewer,
} from "./types";

export const roleOptions: Array<{ slug: RoleSlug; label: string; role: Role }> = [
  { slug: "admin", label: "Master Admin", role: "master_admin" },
  { slug: "manager", label: "Manager", role: "manager" },
  { slug: "employee", label: "Employee", role: "employee" },
];

export function roleFromSlug(slug: string | undefined): Role {
  const option = roleOptions.find((item) => item.slug === slug);
  return option?.role ?? "master_admin";
}

export function slugFromRole(role: Role): RoleSlug {
  if (role === "master_admin") {
    return "admin";
  }

  return role;
}

export function isMasterAdmin(viewer: Viewer): boolean {
  return viewer.role === "master_admin";
}

export function isManager(viewer: Viewer): boolean {
  return viewer.role === "manager";
}

export function isSelf(viewer: Viewer, employeeId: string): boolean {
  return viewer.id === employeeId;
}

export function isDirectReport(
  viewer: Viewer,
  employee: EmployeeRecord | undefined,
): boolean {
  return isManager(viewer) && employee?.managerId === viewer.id;
}

export function canViewEmployeeProfile(
  viewer: Viewer,
  employee: EmployeeRecord,
): boolean {
  return isMasterAdmin(viewer) || isSelf(viewer, employee.id) || isDirectReport(viewer, employee);
}

export function canViewFinancialProfile(
  viewer: Viewer,
  employee: EmployeeRecord,
): boolean {
  return isMasterAdmin(viewer) || isSelf(viewer, employee.id);
}

export function canViewDocument(
  viewer: Viewer,
  document: DocumentRecord,
): boolean {
  return isMasterAdmin(viewer) || isSelf(viewer, document.employeeId);
}

export function canCreateLeaveRequest(viewer: Viewer, employeeId: string): boolean {
  return isMasterAdmin(viewer) || isSelf(viewer, employeeId);
}

export function canViewLeaveRequest(
  viewer: Viewer,
  request: LeaveRequestRecord,
  employee: EmployeeRecord | undefined,
): boolean {
  return isMasterAdmin(viewer) || isSelf(viewer, request.employeeId) || isDirectReport(viewer, employee);
}

export function canDecideLeaveRequest(
  viewer: Viewer,
  request: LeaveRequestRecord,
  employee: EmployeeRecord | undefined,
): boolean {
  if (request.status !== "pending") {
    return false;
  }

  return isMasterAdmin(viewer) || isDirectReport(viewer, employee);
}

export function canGenerateInvoices(viewer: Viewer): boolean {
  return isMasterAdmin(viewer);
}

export function canManageEmployees(viewer: Viewer): boolean {
  return isMasterAdmin(viewer);
}

export function canManageInvoices(viewer: Viewer): boolean {
  return isMasterAdmin(viewer);
}

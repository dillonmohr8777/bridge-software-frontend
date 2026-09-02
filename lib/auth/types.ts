export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  expiresIn: number;
  tokenType: string;
};

export type LoginResponse = AuthSession & {
  user: { id: string; email: string | null };
};

export type CurrentUser = {
  id: string;
  email: string | null;
  accountType: "standard" | "sales_rep" | null;
  platformRoles: "admin"[];
  profile: { displayName: string | null; phone: string | null } | null;
};

export type OrganizationMembership = {
  organizationId: string;
  organizationName: string;
  organizationType: "brand" | "retailer" | "dispensary" | null;
  role: "owner" | "admin" | "reviewer" | "member";
  status: "active" | "invited" | "suspended" | "removed";
};

export type CurrentUserResponse = {
  user: CurrentUser;
  memberships: OrganizationMembership[];
};

export type AdminUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  accountType: string | null;
  platformRole: string | null;
  organizationMemberships: {
    organizationId: string;
    organizationName: string;
    role: string;
  }[];
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: { page: number; pageSize: number; total: number };
};

export type UserRole = "ADMIN" | "USER" | "RUNNER";

export type AccessTokenPayload = {
  userId: string;
  role: UserRole;
};

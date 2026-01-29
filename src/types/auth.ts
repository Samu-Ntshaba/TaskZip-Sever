export type UserRole = "ADMIN" | "USER";

export type AccessTokenPayload = {
  userId: string;
  role: UserRole;
};

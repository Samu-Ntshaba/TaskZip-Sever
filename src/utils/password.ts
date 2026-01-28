import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (value: string) => {
  return bcrypt.hash(value, SALT_ROUNDS);
};

export const verifyPassword = async (value: string, hash: string) => {
  return bcrypt.compare(value, hash);
};

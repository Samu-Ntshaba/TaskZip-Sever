import { Profile, User } from "../generated/prisma";
import { env } from "../env";
import { createSupabaseClient } from "../services/supabaseService";

type UserWithProfile = User & { profile: Profile | null };

type PublicProfile = Profile & { avatarUrl: string | null };

export type PublicUser = Omit<UserWithProfile, "passwordHash" | "resetTokenHash" | "resetTokenExpiresAt" | "emailVerificationTokenHash" | "emailVerificationTokenExpiresAt"> & {
  profile: PublicProfile | null;
};

const buildAvatarUrl = (avatarPath: string | null) => {
  if (!avatarPath) {
    return null;
  }
  const supabase = createSupabaseClient();
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(avatarPath);
  return data.publicUrl ?? null;
};

export const serializeUser = (user: UserWithProfile): PublicUser => {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, emailVerificationTokenHash, emailVerificationTokenExpiresAt, ...safeUser } = user;
  const profile = user.profile
    ? {
        ...user.profile,
        avatarUrl: buildAvatarUrl(user.profile.avatarPath),
      }
    : null;

  return {
    ...safeUser,
    profile,
  };
};

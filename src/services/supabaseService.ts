import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
import { v4 as uuidv4 } from "uuid";
import { HttpError } from "../utils/errors";

export const createSupabaseClient = () => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const validateAvatarFile = (file: Express.Multer.File) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new HttpError("Unsupported file type", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError("File too large", 400);
  }
};

export const generateAvatarPath = (userId: string, originalName: string) => {
  const ext = originalName.split(".").pop() ?? "jpg";
  return `avatars/${userId}/${Date.now()}-${uuidv4()}.${ext}`;
};

export const uploadAvatar = async (
  file: Express.Multer.File,
  userId: string,
  existingPath?: string | null
) => {
  validateAvatarFile(file);
  const supabase = createSupabaseClient();
  const path = generateAvatarPath(userId, file.originalname);

  const { error } = await supabase.storage.from(env.SUPABASE_BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new HttpError(error.message, 500);
  }

  if (existingPath) {
    await supabase.storage.from(env.SUPABASE_BUCKET).remove([existingPath]);
  }

  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl ?? null,
  };
};

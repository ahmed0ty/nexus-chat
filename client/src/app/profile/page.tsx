"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/axios";
import { cn, getInitials } from "@/lib/utils";
import { ApiResponse, User } from "@/types";

const profileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(200).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? "",
      bio: user?.bio ?? "",
    },
  });

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setUploadingAvatar(true);
      try {
        const { data } = await api.post<ApiResponse<User>>("/users/avatar", {
          base64Image: base64,
        });
        if (data.data) updateUser({ avatar: data.data.avatar });
      } catch {
        console.error("Avatar upload failed");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (formData: ProfileForm) => {
    try {
      const { data } = await api.put<ApiResponse<User>>("/users/profile", formData);
      if (data.data) {
        updateUser(data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      console.error("Profile update failed");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {avatarPreview || user.avatar ? (
              <img
                src={avatarPreview ?? user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-medium">
                {getInitials(user.username)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center cursor-pointer transition-colors">
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <p className="text-gray-400 text-sm mt-2">Click to change photo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              {...register("username")}
              className={cn(
                "w-full bg-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                errors.username ? "border-red-500" : "border-gray-600"
              )}
            />
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="Tell something about yourself..."
              className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full bg-gray-700/50 text-gray-400 rounded-xl px-4 py-3 text-sm border border-gray-600 cursor-not-allowed"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors",
              saved
                ? "bg-green-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white"
            )}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              "✓ Saved!"
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { motion } from "framer-motion";
// import { Eye, EyeOff, Mail, Lock, MessageCircle } from "lucide-react";
// import api from "@/lib/axios";
// import { useAuthStore } from "@/stores/authStore";
// import { AuthResponse, ApiResponse } from "@/types";
// import { cn } from "@/lib/utils";

// const loginSchema = z.object({
//   email: z.string().email("Invalid email"),
//   password: z.string().min(1, "Password is required"),
// });

// type LoginForm = z.infer<typeof loginSchema>;

// export default function LoginPage() {
//   const router = useRouter();
//   const { setAuth } = useAuthStore();
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");

//   const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//   });

//   const onSubmit = async (data: LoginForm) => {
//     try {
//       setError("");
//       const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
//       if (res.data.data) {
//         setAuth(res.data.data.user, {
//           accessToken: res.data.data.accessToken,
//           refreshToken: res.data.data.refreshToken,
//         });
//         router.push("/chat");
//       }
//     } catch {
//       setError("Invalid email or password");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="w-full max-w-md"
//       >
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
//             <MessageCircle className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-white">Nexus Chat</h1>
//           <p className="text-gray-400 mt-2">Welcome back</p>
//         </div>

//         {/* Form */}
//         <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//             {error && (
//               <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
//                 {error}
//               </div>
//             )}

//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Email
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   {...register("email")}
//                   type="email"
//                   placeholder="you@example.com"
//                   className={cn(
//                     "w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-3 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
//                     errors.email ? "border-red-500" : "border-gray-600"
//                   )}
//                 />
//               </div>
//               {errors.email && (
//                 <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
//               )}
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   {...register("password")}
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   className={cn(
//                     "w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg pl-10 pr-10 py-3 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
//                     errors.password ? "border-red-500" : "border-gray-600"
//                   )}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
//                 >
//                   {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
//               )}
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
//             >
//               {isSubmitting ? "Signing in..." : "Sign in"}
//             </button>
//           </form>

//           {/* Divider */}
//           <div className="relative my-6">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-600" />
//             </div>
//             <div className="relative flex justify-center text-xs text-gray-400">
//               <span className="bg-gray-800 px-2">or continue with</span>
//             </div>
//           </div>

//           {/* OAuth */}
//           <div className="grid grid-cols-2 gap-3">
//             <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm transition-colors border border-gray-600">
//               <svg className="w-4 h-4" viewBox="0 0 24 24">
//                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
//                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
//                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
//                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
//               </svg>
//               Google
//             </button>
//             <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm transition-colors border border-gray-600">
//               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//               </svg>
//               GitHub
//             </button>
//           </div>

//           <p className="text-center text-sm text-gray-400 mt-6">
//             Don&apos;t have an account?{" "}
//             <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
//               Sign up
//             </Link>
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, MessageCircle } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { AuthResponse, ApiResponse } from "@/types";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
      if (res.data.data) {
        setAuth(res.data.data.user, {
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
        });
        router.push("/chat");
      }
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Nexus Chat
          </h1>
          <p className="mt-2" style={{ color: "var(--text-muted)" }}>Welcome back</p>
        </div>

        <div className="rounded-2xl p-8 shadow-xl border"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className={cn(
                    "w-full rounded-lg pl-10 pr-4 py-3 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors.email ? "border-red-500" : ""
                  )}
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderColor: errors.email ? "" : "var(--border)",
                  }}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg pl-10 pr-10 py-3 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors.password ? "border-red-500" : ""
                  )}
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderColor: errors.password ? "" : "var(--border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="px-2" style={{ backgroundColor: "var(--bg-secondary)" }}>or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors border"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", borderColor: "var(--border)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors border"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", borderColor: "var(--border)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
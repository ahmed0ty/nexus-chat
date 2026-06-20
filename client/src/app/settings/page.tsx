"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Moon, Sun, Monitor,
  Bell, Shield, LogOut
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { Theme, Language } from "@/types";
import api from "@/lib/axios";

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
];

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      await api.put("/users/settings", { theme: newTheme });
    } catch { /* ignore */ }
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    try {
      await api.put("/users/settings", { language: newLang });
    } catch { /* ignore */ }
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
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
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Theme */}
        <section>
          <h2 className="text-xs font-medium text-gray-400 uppercase mb-3 px-1">Appearance</h2>
          <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm font-medium text-white">Theme</p>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 rounded-xl transition-colors text-sm",
                    theme === t.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="text-xs font-medium text-gray-400 uppercase mb-3 px-1">Language</h2>
          <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            {LANGUAGES.map((lang, i) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-colors",
                  i < LANGUAGES.length - 1 ? "border-b border-gray-700" : "",
                  language === lang.value ? "bg-indigo-600/20" : "hover:bg-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm text-white">{lang.label}</span>
                </div>
                {language === lang.value && (
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-medium text-gray-400 uppercase mb-3 px-1">Notifications</h2>
          <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 text-white text-sm">
                <span className="text-gray-400">
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <p>Message notifications</p>
                  {!isSupported && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Not supported on this browser
                    </p>
                  )}
                  {isSupported && permission === "denied" && (
                    <p className="text-xs text-red-400 mt-0.5">
                      Blocked — enable from browser settings
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleToggleNotifications}
                disabled={!isSupported || permission === "denied"}
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors flex-shrink-0",
                  isSubscribed ? "bg-indigo-600" : "bg-gray-600",
                  (!isSupported || permission === "denied") && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isSubscribed ? "right-1" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-xs font-medium text-gray-400 uppercase mb-3 px-1">Account</h2>
          <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            <button
              onClick={() => router.push("/profile")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors border-b border-gray-700"
            >
              <Shield className="w-4 h-4 text-gray-400" />
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
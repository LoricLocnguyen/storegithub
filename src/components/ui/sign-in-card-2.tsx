import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignInCardProps {
  mode: "login" | "signup";
  email: string;
  password: string;
  displayName: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onDisplayNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
}

export function SignInCard2({
  mode,
  email,
  password,
  displayName,
  loading,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onSubmit,
  onToggleMode,
}: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isLogin = mode === "login";

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0612] px-4">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-[#0a0612] to-fuchsia-950/30" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")" }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
      <motion.div
        className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-[100px]"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-violet-500/20 blur-[110px]"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3D Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card glow */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-fuchsia-500/30 to-violet-500/30 blur-md opacity-60" />

        {/* Traveling light beams */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-purple-300 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent"
            animate={{ x: ["100%", "-200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
          />
        </div>

        {/* Glass card */}
        <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/30 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              S
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent" />
            </motion.div>
            <h1 className="text-2xl font-semibold text-white">
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {isLogin ? "Đăng nhập để tiếp tục" : "Đăng ký để bắt đầu"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Tên hiển thị"
                      value={displayName}
                      onChange={(e) => onDisplayNameChange(e.target.value)}
                      onFocus={() => setFocusedInput("name")}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-white/5 border border-transparent focus:border-white/20 rounded-md text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 focus:outline-none"
                    />
                    {focusedInput === "name" && (
                      <motion.div layoutId="input-glow" className="absolute inset-0 rounded-md ring-1 ring-purple-400/40 pointer-events-none" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-white/40" />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                required
                className="w-full bg-white/5 border border-transparent focus:border-white/20 rounded-md text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 focus:outline-none"
              />
              {focusedInput === "email" && (
                <motion.div layoutId="input-glow" className="absolute inset-0 rounded-md ring-1 ring-purple-400/40 pointer-events-none" />
              )}
            </div>

            {/* Password */}
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-transparent focus:border-white/20 rounded-md text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {focusedInput === "password" && (
                <motion.div layoutId="input-glow" className="absolute inset-0 rounded-md ring-1 ring-purple-400/40 pointer-events-none" />
              )}
            </div>

            {/* Remember me */}
            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-purple-500 checked:border-purple-500 focus:outline-none transition-all"
                    />
                    {rememberMe && (
                      <svg className="absolute inset-0 w-4 h-4 text-white pointer-events-none" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-white/60 group-hover:text-white/80">Ghi nhớ</span>
                </label>
                <button type="button" className="text-white/60 hover:text-white transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "relative w-full h-11 rounded-md overflow-hidden",
                "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_100%]",
                "text-white font-medium shadow-lg shadow-purple-500/30",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition-all"
              )}
              style={{ animation: loading ? undefined : "shimmer 3s linear infinite" }}
            >
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/40">hoặc</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-white/50">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
              >
                {isLogin ? "Đăng ký" : "Đăng nhập"}
              </button>
            </p>
          </form>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export default SignInCard2;

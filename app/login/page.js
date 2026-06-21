"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Brand";
import { Button } from "@/components/ui";
import { Smartphone, ShieldCheck, KeyRound, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // phone | otp | sso
  const [phone, setPhone] = useState("01711000001");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  function sendOtp() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); }, 700);
  }
  function verify() {
    setLoading(true);
    setTimeout(() => { router.push("/drive"); }, 800);
  }
  function sso() {
    setStep("sso"); setLoading(true);
    setTimeout(() => { router.push("/drive"); }, 1100);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bl-gradient text-white p-12 flex-col justify-between">
        <Logo size={40} light />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Your photos, files and memories — safe in the cloud.</h1>
          <p className="mt-4 text-white/90">Sign in with your Banglalink number or MyBL account. Backup, sync and access your files across every device.</p>
          <div className="mt-8 space-y-3">
            {["Single Sign-On with MyBL / Ryze","OTP-secured login","Encrypted storage, RBAC & secure sharing"].map((x) => (
              <div key={x} className="flex items-center gap-2 text-white/95"><CheckCircle2 size={18} /> {x}</div>
            ))}
          </div>
        </div>
        <div className="text-white/70 text-xs">Demo · authentication is simulated.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo size={38} /></div>
          <h2 className="text-2xl font-bold text-bl-ink">Sign in to Banglalink Cloud</h2>
          <p className="text-bl-slate text-sm mt-1">Access your personal cloud storage.</p>

          <button onClick={sso} disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 border border-bl-line bg-white rounded-xl py-3 font-semibold text-bl-ink hover:bg-bl-mist transition">
            {step === "sso" ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} className="text-bl-orange" />}
            Continue with MyBL Single Sign-On
          </button>

          <div className="flex items-center gap-3 my-5 text-xs text-bl-slate">
            <span className="flex-1 h-px bg-bl-line" /> or use mobile number <span className="flex-1 h-px bg-bl-line" />
          </div>

          {step !== "otp" && (
            <div>
              <label className="text-sm font-semibold text-bl-ink">Mobile number</label>
              <div className="mt-1.5 flex items-center border border-bl-line rounded-xl overflow-hidden focus-within:ring-2 ring-bl-orange/40">
                <span className="px-3 py-3 bg-bl-mist text-bl-slate text-sm font-medium border-r border-bl-line">+88</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-3 py-3 outline-none text-bl-ink" placeholder="01XXXXXXXXX" />
              </div>
              <Button onClick={sendOtp} disabled={loading} size="lg" className="w-full mt-4">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />} Send OTP
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="animate-slideup">
              <label className="text-sm font-semibold text-bl-ink">Enter the 4-digit code</label>
              <p className="text-xs text-bl-slate mt-1">We sent an OTP to +88{phone}. (Demo: type anything)</p>
              <div className="mt-3 flex items-center border border-bl-line rounded-xl overflow-hidden focus-within:ring-2 ring-bl-orange/40">
                <span className="px-3 py-3 bg-bl-mist text-bl-slate border-r border-bl-line"><KeyRound size={18} /></span>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="flex-1 px-3 py-3 outline-none tracking-[0.5em] text-bl-ink" placeholder="••••" />
              </div>
              <Button onClick={verify} disabled={loading} size="lg" className="w-full mt-4">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />} Verify & continue
              </Button>
              <button onClick={() => setStep("phone")} className="w-full text-center text-sm text-bl-slate mt-3 hover:text-bl-ink">Change number</button>
            </div>
          )}

          <p className="text-xs text-bl-slate mt-6 text-center">By continuing you agree to Banglalink's Terms & Privacy Policy. Your data stays within Bangladesh.</p>
        </div>
      </div>
    </div>
  );
}

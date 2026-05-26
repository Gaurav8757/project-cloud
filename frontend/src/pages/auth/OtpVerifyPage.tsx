import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';

export default function OtpVerifyPage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const navigate = useNavigate();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);

  const handle = (i: number, v: string) => {
    const ch = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length === 6) {
      setDigits(t.split(''));
      refs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const submit = async () => {
    const otp = digits.join('');
    if (otp.length < 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      toast.success('OTP verified. Set your new password.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email || 'your inbox'}.`}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChange={(e) => handle(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              maxLength={1}
              inputMode="numeric"
              className="h-14 w-12 text-center text-xl font-bold font-mono rounded-lg border-2 border-input bg-background ring-focus focus-visible:border-primary"
            />
          ))}
        </div>
        <Button onClick={submit} variant="gradient" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify code'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Didn't get it?{' '}
          <button
            type="button"
            onClick={async () => {
              if (!email) return;
              const res = await authService.forgotPassword(email);
              toast.success('Code resent');
              if (res.devOtp) toast.info(`Dev OTP: ${res.devOtp}`);
            }}
            className="text-primary hover:underline font-medium"
          >
            Resend
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/shared/auth';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, status } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const from = params.get('from') || '/';
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { email: 'admin@moscow-roads.local', password: 'Passw0rd!' },
  });
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('Вход выполнен');
      nav(from, { replace: true });
    } catch (err: any) {
      toast.error('Неверный email или пароль');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--tp-bg-app)' }}>
      <div className="panel w-[380px] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-extrabold"
            style={{ background: 'var(--tp-brand)' }}
          >
            М
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">Moscow Roads</div>
            <div className="text-xs text-tpmuted">ЦОДД · Москва</div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-tpmuted">Email</label>
            <input className="input mt-1" type="email" autoComplete="email" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-tpmuted">Пароль</label>
            <input
              className="input mt-1"
              type="password"
              autoComplete="current-password"
              {...register('password', { required: true, minLength: 6 })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting || formState.isSubmitting}>
            {submitting ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

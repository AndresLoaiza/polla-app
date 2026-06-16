import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';
import { checkAccessCode, storeUsuario, USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Usuario } from '../../types';

export default function AccessGate({ onUnlocked }: { onUnlocked: (u: Usuario) => void }) {
  const [step, setStep] = useState<'code' | 'who'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!code.trim() || checking) return;
    setChecking(true);
    const ok = await checkAccessCode(code);
    setChecking(false);
    if (ok) { setError(false); setStep('who'); } else setError(true);
  }

  function pick(u: Usuario) { storeUsuario(u); onUnlocked(u); }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {step === 'code' ? (
          <motion.div key="code" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} className="glass glass-card w-full max-w-sm text-center p-8">
            <Trophy className="w-10 h-10 mx-auto mb-3" aria-hidden />
            <h1 className="font-bold text-2xl">Polla Mundial 2026</h1>
            <p className="opacity-70 mt-1 mb-6">Solo nosotros dos</p>
            <motion.input
              animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
              type="password" value={code} onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Código secreto"
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-center outline-none" />
            {error && <p className="text-red-400 text-sm mt-2">Código incorrecto</p>}
            <button onClick={submit} disabled={checking}
              className="glass mt-5 w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" aria-hidden /> Entrar
            </button>
          </motion.div>
        ) : (
          <motion.div key="who" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center">
            <h2 className="font-bold text-xl mb-5">¿Quién eres?</h2>
            <div className="grid grid-cols-2 gap-4">
              {(['melisa', 'andres'] as Usuario[]).map(u => (
                <button key={u} onClick={() => pick(u)}
                  className="glass glass-card py-8 font-semibold text-lg"
                  style={{ boxShadow: `0 0 0 2px ${USER_COLOR[u]}` }}>
                  <span style={{ color: USER_COLOR[u] }}>{USER_NOMBRE[u]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from "react";
import { UserSession, ManagedUser } from "../types";
import { Key, User, ShieldAlert, Sparkles, HelpCircle, AlertCircle, Mail, ArrowLeft, Send, CheckCircle2, Gamepad2, Trophy, Flame, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { playClickSound, playPointsApprovedSound } from "../lib/sounds";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface LoginScreenProps {
  users: ManagedUser[];
  onLogin: (session: UserSession) => void;
}

type AuthMode = "login" | "signup" | "forgot";

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  // Mode of the Auth panel
  const [mode, setMode] = useState<AuthMode>("login");

  // Input states
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"pai" | "mae">("pai");
  const [regAvatar, setRegAvatar] = useState("👨‍💼");

  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  // Status/Error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle standard Username login OR Firebase Email login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const input = usernameOrEmail.trim();

    // 1. Detect if it's an email address
    if (input.includes("@")) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, input, password);
        const fbUser = userCredential.user;

        // Try to find matching ManagedUser in the list
        const foundUser = users.find(u => u.id === fbUser.uid || u.username.toLowerCase() === fbUser.email?.toLowerCase());

        if (foundUser) {
          onLogin({
            role: foundUser.role,
            name: foundUser.name,
            avatar: foundUser.avatar,
            username: foundUser.username,
            partnerName: users.find(u => u.id !== foundUser.id && (u.role === "pai" || u.role === "mae"))?.name || undefined
          });
        } else {
          // If not in firestore list but successfully authenticated in Firebase Auth, auto-create their Firestore record
          const username = fbUser.email?.split("@")[0] || "usuario";
          const newManagedUser: ManagedUser = {
            id: fbUser.uid,
            username: username,
            name: fbUser.displayName || username,
            password: "firebase_auth",
            role: "pai",
            avatar: "👨‍💼"
          };

          // Save to firestore
          await setDoc(doc(db, "users", fbUser.uid), newManagedUser);

          playPointsApprovedSound();
          onLogin({
            role: "pai",
            name: newManagedUser.name,
            avatar: newManagedUser.avatar,
            username: newManagedUser.username
          });
        }
      } catch (err: any) {
        console.error("Firebase Login Error:", err);
        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          setErrorMsg("E-mail ou senha incorretos.");
        } else if (err.code === "auth/invalid-email") {
          setErrorMsg("Formato de e-mail inválido.");
        } else {
          setErrorMsg("Erro ao fazer login. Verifique sua conexão.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // 2. Treat as standard offline/Firestore local credential
      const cleanUser = input.toLowerCase();
      const foundUser = users.find(u => u.username.trim().toLowerCase() === cleanUser);

      if (foundUser && foundUser.password === password) {
        let partnerName = "";
        if (foundUser.role === "pai" || foundUser.role === "mae") {
          const otherParent = users.find(
            u => u.id !== foundUser.id && (u.role === "pai" || u.role === "mae")
          );
          partnerName = otherParent ? otherParent.name : "";
        }

        playPointsApprovedSound();
        onLogin({
          role: foundUser.role,
          name: foundUser.name,
          avatar: foundUser.avatar,
          username: foundUser.username,
          partnerName: partnerName || undefined
        });
        setLoading(false);
      } else {
        setErrorMsg("Usuário ou senha incorretos.");
        setLoading(false);
      }
    }
  };

  // Handle Firebase Email SignUp
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const fbUser = userCredential.user;

      // 2. Store user document in Firestore users collection
      const username = regEmail.trim().split("@")[0];
      const newManagedUser: ManagedUser = {
        id: fbUser.uid,
        username: username,
        name: regName.trim(),
        password: "firebase_auth",
        role: regRole,
        avatar: regAvatar
      };

      await setDoc(doc(db, "users", fbUser.uid), newManagedUser);

      playPointsApprovedSound();
      // 3. Login session
      onLogin({
        role: regRole,
        name: newManagedUser.name,
        avatar: newManagedUser.avatar,
        username: newManagedUser.username
      });
    } catch (err: any) {
      console.error("Firebase Sign Up Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Este e-mail já está sendo utilizado.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("A senha precisa ter pelo menos 6 caracteres.");
      } else {
        setErrorMsg("Erro ao cadastrar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Password Reset Email
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!recoveryEmail.trim()) {
      setErrorMsg("Por favor, preencha o e-mail.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, recoveryEmail.trim());
      setRecoverySent(true);
    } catch (err: any) {
      console.error("Password recovery error:", err);
      if (err.code === "auth/user-not-found") {
        setErrorMsg("Não encontramos nenhuma conta com este e-mail.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Por favor, digite um e-mail válido.");
      } else {
        setErrorMsg("Erro ao enviar e-mail de recuperação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] py-4 flex flex-col justify-center items-center animate-fade-in" id="login-container">
      {/* Branding Header */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <div className="relative group">
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-tertiary opacity-75 blur-md group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-4xl shadow-[0_4px_15px_rgba(124,58,237,0.4)]">
            🎮
          </div>
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-none mt-3 flex items-center gap-1.5 justify-center">
          Focus Kids <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm select-none">v2.0</span>
        </h1>
        <p className="text-xs text-on-surface-variant font-extrabold mt-1 text-center max-w-[340px] leading-relaxed">
          🏆 Seu Portal de Missões, Pontos e Prêmios Épicos! 🚀✨
        </p>
      </div>

      {/* Main Login / Registration Card */}
      <div className="w-full bg-surface-container-lowest p-6 rounded-2xl border-2 border-primary/20 shadow-[0_10px_35px_rgba(124,58,237,0.06)] relative overflow-visible">
        {/* Top Floating Badge */}
        <div className="flex justify-center -mt-10 mb-6 select-none">
          {mode === "login" ? (
            <span className="bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border-2 border-white">
              <Gamepad2 className="w-3.5 h-3.5" /> Portal de Entrada
            </span>
          ) : mode === "signup" ? (
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border-2 border-white">
              <User className="w-3.5 h-3.5" /> Cadastro dos Pais
            </span>
          ) : (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border-2 border-white">
              <HelpCircle className="w-3.5 h-3.5" /> Recuperação
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="text-base font-black text-on-surface mb-1 text-center">
                Entrar na Conta
              </h2>
              <p className="text-[11px] text-on-surface-variant text-center mb-5 font-medium">
                Digite seu usuário ou o e-mail dos pais para sincronizar
              </p>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => {
                        setUsernameOrEmail(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Ex: bernardo, david ou email@exemplo.com"
                      className="w-full bg-surface-container pl-12 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/40 focus:bg-white outline-none transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/40"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setErrorMsg(null); }}
                      className="text-[10px] font-extrabold text-primary hover:underline"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Sua senha de login"
                      className="w-full bg-surface-container pl-12 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/40 focus:bg-white outline-none transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/40 tracking-wider"
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-error/10 text-error p-3 rounded-xl flex gap-2 items-center text-xs font-bold border border-error/20">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/95 hover:to-purple-600/95 text-white py-3.5 rounded-full font-black text-xs uppercase tracking-wider mt-2 shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-98 hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-yellow-300 animate-bounce shrink-0" />
                  {loading ? "Carregando Arena..." : "Iniciar Jornada 🚀"}
                </button>

                <div className="border-t border-outline-variant/30 mt-3 pt-3 text-center">
                  <span className="text-xs text-on-surface-variant font-semibold">Conta de e-mail para os pais? </span>
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setErrorMsg(null); }}
                    className="text-xs font-black text-primary hover:underline"
                  >
                    Cadastre-se aqui
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMsg(null); }}
                className="absolute top-4 left-4 text-on-surface-variant/80 hover:text-on-surface flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <h2 className="text-base font-black text-on-surface mb-1 text-center mt-4">
                Criar Conta dos Pais
              </h2>
              <p className="text-[11px] text-on-surface-variant text-center mb-5 font-semibold">
                Crie um login seguro de e-mail para sincronizar a rotina
              </p>

              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: David, Beatriz"
                    className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-2 w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-surface-container pl-12 pr-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    Definir Senha
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-2 w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-surface-container pl-12 pr-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-semibold tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                      Responsável
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => {
                        const val = e.target.value as "pai" | "mae";
                        setRegRole(val);
                        setRegAvatar(val === "pai" ? "👨‍💼" : "👩‍💼");
                      }}
                      className="w-full bg-surface-container px-3 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none text-on-surface font-bold"
                    >
                      <option value="pai">Pai</option>
                      <option value="mae">Mãe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                      Ícone Avatar
                    </label>
                    <div className="flex gap-2 justify-center items-center h-10 bg-surface-container rounded-xl">
                      {["👨‍💼", "👩‍💼", "🦸‍♂️", "🦸‍♀️"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setRegAvatar(emoji)}
                          className={`text-xl p-1 rounded-lg transition-all ${
                            regAvatar === emoji ? "bg-teal-500/20 scale-110" : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-error/10 text-error p-3 rounded-xl flex gap-2 items-center text-xs font-bold border border-error/20">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-3.5 rounded-full font-black text-xs uppercase tracking-wider mt-2 shadow-[0_4px_15px_rgba(20,184,166,0.3)] hover:scale-[1.02] active:scale-98 transition-all"
                >
                  {loading ? "Criando Avatar..." : "Concluir Cadastro 🎮"}
                </button>
              </form>
            </motion.div>
          )}

          {mode === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMsg(null); setRecoverySent(false); }}
                className="absolute top-4 left-4 text-on-surface-variant/80 hover:text-on-surface flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <h2 className="text-base font-black text-on-surface mb-1 text-center mt-4">
                Recuperar Senha
              </h2>
              <p className="text-[11px] text-on-surface-variant text-center mb-5 font-semibold">
                Enviaremos um link de recuperação para o seu e-mail cadastrado
              </p>

              {!recoverySent ? (
                <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Seu E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-surface-container pl-12 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/40 focus:bg-white outline-none transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/40"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-error/10 text-error p-3 rounded-xl flex gap-2 items-center text-xs font-bold border border-error/20">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 rounded-full font-black text-xs uppercase tracking-wider mt-2 shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "Enviando..." : "Enviar Link de Acesso"}
                  </button>
                </form>
              ) : (
                <div className="text-center flex flex-col gap-4 items-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-on-surface text-sm">Link Enviado com Sucesso!</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Verifique sua caixa de entrada e a pasta de spam do e-mail <strong>{recoveryEmail}</strong> para redefinir sua senha.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setErrorMsg(null); setRecoverySent(false); }}
                    className="mt-2 text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
                  >
                    Voltar para a Tela de Login
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How it works Game Quest Board */}
      <div className="w-full mt-6 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-purple-100 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
        <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2.5 rounded-xl text-white shrink-0 shadow-md">
          <Trophy className="w-4 h-4 text-yellow-300" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            Como Funciona a sua Jornada:
          </h4>
          <ul className="text-[11px] text-on-surface-variant font-semibold mt-2.5 space-y-2 list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0 text-sm">⚡</span>
              <span><strong>Complete Missões:</strong> Faça suas tarefas diárias, rotinas e estudos para acumular progresso.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5 shrink-0 text-sm">🪙</span>
              <span><strong>Ganhe Pontos:</strong> Peça a aprovação dos pais no painel deles para coletar suas moedas de ouro.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 mt-0.5 shrink-0 text-sm">🎁</span>
              <span><strong>Resgate Prêmios:</strong> Troque suas moedas por tempo de tela, lanches e passeios incríveis!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { UserSession, ManagedUser } from "../types";
import { Key, User, ShieldAlert, Sparkles, HelpCircle, AlertCircle, Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
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
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-4xl shadow-md">
          🎯
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tight leading-none mt-2">
          Focus Kids
        </h1>
        <p className="text-xs text-on-surface-variant font-semibold mt-1">
          Plataforma de Foco e Sincronização em Nuvem ☁️
        </p>
      </div>

      {/* Main Login / Registration Card */}
      <div className="w-full bg-surface-container-lowest p-6 rounded-2xl border-2 border-outline-variant/30 shadow-sm relative">
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="text-lg font-bold text-on-surface mb-1 text-center">
                Entrar na Conta
              </h2>
              <p className="text-xs text-on-surface-variant text-center mb-5">
                Digite seu usuário, ou e-mail dos pais para sincronizar
              </p>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-on-surface-variant/70" />
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => {
                        setUsernameOrEmail(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Ex: david, bernardo ou email@exemplo.com"
                      className="w-full bg-surface-container pl-10 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium placeholder:text-on-surface-variant/50"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setErrorMsg(null); }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Esqueceu a Senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 w-4 h-4 text-on-surface-variant/70" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="••••"
                      className="w-full bg-surface-container pl-10 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium placeholder:text-on-surface-variant/50 tracking-wider"
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
                  className="w-full bg-primary text-on-primary py-3.5 rounded-full font-bold text-sm tracking-wide mt-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all chunky-button flex items-center justify-center gap-2"
                >
                  {loading ? "Acessando..." : "Acessar Sistema"}
                </button>

                <div className="border-t border-outline-variant/30 mt-3 pt-3 text-center">
                  <span className="text-xs text-on-surface-variant font-medium">Conta de E-mail para os Pais? </span>
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setErrorMsg(null); }}
                    className="text-xs font-bold text-primary hover:underline"
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

              <h2 className="text-lg font-bold text-on-surface mb-1 text-center mt-4">
                Criar Conta dos Pais
              </h2>
              <p className="text-xs text-on-surface-variant text-center mb-5">
                Crie um login seguro de e-mail no Firebase para sincronização
              </p>

              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: David, Beatriz"
                    className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/70" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-surface-container pl-10 pr-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                    Definir Senha
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/70" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-surface-container pl-10 pr-4 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                      Responsável
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => {
                        const val = e.target.value as "pai" | "mae";
                        setRegRole(val);
                        setRegAvatar(val === "pai" ? "👨‍💼" : "👩‍💼");
                      }}
                      className="w-full bg-surface-container px-3 py-2.5 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none text-on-surface font-semibold"
                    >
                      <option value="pai">Pai</option>
                      <option value="mae">Mãe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">
                      Ícone Avatar
                    </label>
                    <div className="flex gap-2 justify-center items-center h-10 bg-surface-container rounded-xl">
                      {["👨‍💼", "👩‍💼", "🦸‍♂️", "🦸‍♀️"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setRegAvatar(emoji)}
                          className={`text-xl p-1.5 rounded-lg transition-all ${
                            regAvatar === emoji ? "bg-primary/20 scale-110" : "opacity-60 hover:opacity-100"
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
                  className="w-full bg-primary text-on-primary py-3.5 rounded-full font-bold text-sm tracking-wide mt-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all chunky-button"
                >
                  {loading ? "Cadastrando..." : "Concluir Cadastro"}
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

              <h2 className="text-lg font-bold text-on-surface mb-1 text-center mt-4">
                Recuperar Senha
              </h2>
              <p className="text-xs text-on-surface-variant text-center mb-5">
                Enviaremos um link seguro para o seu e-mail cadastrado
              </p>

              {!recoverySent ? (
                <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Seu E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-on-surface-variant/70" />
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-surface-container pl-10 pr-4 py-3 rounded-xl text-sm border-2 border-transparent focus:border-primary/30 outline-none transition-all text-on-surface font-medium placeholder:text-on-surface-variant/50"
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
                    className="w-full bg-primary text-on-primary py-3.5 rounded-full font-bold text-sm tracking-wide mt-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all chunky-button flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "Enviando..." : "Enviar E-mail de Recuperação"}
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

      {/* Cloud & Realtime syncing description */}
      <div className="w-full mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-primary">Sincronização em Nuvem (Firebase)</h4>
          <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
            Os dados do Focus Kids agora estão seguros na nuvem! Toda a família vê as mesmas missões e pontuações em tempo real nas duas casas, com suporte para login de e-mail e redefinição de senha!
          </p>
        </div>
      </div>


    </div>
  );
}

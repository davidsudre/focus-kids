import React, { useState } from "react";
import { UserSession, ManagedUser } from "../types";
import { Key, User, ShieldAlert, Sparkles, HelpCircle, AlertCircle, Mail, ArrowLeft, Send, CheckCircle2, Trophy, Flame, Coins, Target, X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { playClickSound, playPointsApprovedSound } from "../lib/sounds";
import { doc, setDoc } from "firebase/firestore";

interface LoginScreenProps {
  users: ManagedUser[];
  onLogin: (session: UserSession) => void;
}

type AuthMode = "login" | "signup" | "forgot";

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  // Mode of the Auth panel
  const [mode, setMode] = useState<AuthMode>("login");

  // Tooltip states
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
  // Handle standard Username or Email login via Firestore-synchronized user records
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const input = usernameOrEmail.trim().toLowerCase();
    const inputPrefix = input.includes("@") ? input.split("@")[0] : input;

    // Look up the user in our reactive users list with extreme robustness
    const foundUser = users.find(
      u => (u.username && u.username.trim().toLowerCase() === input) || 
           (u.email && u.email.trim().toLowerCase() === input) ||
           (u.username && u.username.trim().toLowerCase() === inputPrefix) ||
           (u.email && u.email.trim().toLowerCase().split("@")[0] === inputPrefix) ||
           (u.id && u.id.toLowerCase() === input)
    );

    if (foundUser) {
      if (foundUser.password === password) {
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
        setErrorMsg("Senha incorreta.");
        setLoading(false);
      }
    } else {
      setErrorMsg("Usuário não encontrado.");
      setLoading(false);
    }
  };

  // Handle custom signup directly inside Firestore (uniquely keys on username)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const name = regName.trim();
    const email = regEmail.trim();
    const cleanPassword = regPassword.trim();

    if (!name || !email || !cleanPassword) {
      setErrorMsg("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    const username = email.includes("@") ? email.split("@")[0].toLowerCase() : email.toLowerCase();

    // Check if username already exists
    const userExists = users.some(
      u => u.username.trim().toLowerCase() === username
    );

    if (userExists) {
      setErrorMsg("Este usuário já está cadastrado.");
      setLoading(false);
      return;
    }

    try {
      const newId = "u_" + Math.random().toString(36).substring(2, 11);
      const newManagedUser: ManagedUser = {
        id: newId,
        username: username,
        email: email.toLowerCase(),
        name: name,
        password: cleanPassword,
        role: regRole,
        avatar: regAvatar
      };

      await setDoc(doc(db, "users", newId), newManagedUser);

      playPointsApprovedSound();
      onLogin({
        role: regRole,
        name: newManagedUser.name,
        avatar: newManagedUser.avatar,
        username: newManagedUser.username
      });
    } catch (err: any) {
      console.error("Firestore Sign Up Error:", err);
      setErrorMsg("Erro ao cadastrar conta no banco de dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Handle recovery: in a family app with visible/stored passwords, remind the user or instruct them to talk to parents
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!recoveryEmail.trim()) {
      setErrorMsg("Por favor, preencha o usuário.");
      setLoading(false);
      return;
    }

    const input = recoveryEmail.trim().toLowerCase();
    const foundUser = users.find(
      u => u.username.trim().toLowerCase() === input
    );

    if (foundUser) {
      setRecoverySent(true);
    } else {
      setErrorMsg("Nenhum usuário correspondente foi encontrado.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] py-4 flex flex-col justify-center items-center animate-fade-in" id="login-container">
      {/* Branding Header */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <div className="relative group">
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-primary via-indigo-500 to-purple-600 opacity-75 blur-md group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-[0_4px_15px_rgba(0,96,172,0.3)]">
            <Target className="w-8 h-8 animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-none mt-3">
          Focus Kids
        </h1>
        <p className="text-xs text-on-surface-variant font-extrabold mt-1 text-center max-w-[340px] leading-relaxed">
          🎯 Seu Portal de Concentração, Missões e Conquistas! ✨🚀
        </p>
      </div>

      {/* Main Login / Registration Card */}
      <div className="w-full bg-surface-container-lowest p-6 rounded-2xl border-2 border-primary/20 shadow-[0_10px_35px_rgba(124,58,237,0.06)] relative overflow-visible">
        {/* Top Floating Badge */}
        <div className="flex justify-center -mt-10 mb-6 select-none">
          {mode === "login" ? (
            <span className="bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border-2 border-white">
              <Target className="w-3.5 h-3.5" /> Arena de Foco
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
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                      Usuário ou E-mail
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="text-primary hover:text-purple-600 transition-colors p-0.5 flex items-center justify-center rounded-full bg-primary/5 hover:bg-primary/10"
                        title="Ajuda com as Contas"
                      >
                        <HelpCircle className="w-3.5 h-3.5 cursor-help" />
                      </button>
                      
                      <AnimatePresence>
                        {showTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 bottom-6 w-72 bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-xl border border-white/10 text-xs z-50 leading-relaxed font-semibold"
                          >
                            <div className="flex items-center gap-1.5 mb-2 text-primary-fixed font-black">
                              <Sparkles className="w-4 h-4 text-yellow-300" />
                              <span>Formato do Campo:</span>
                            </div>
                            <p className="text-[11px] mb-2 leading-relaxed">
                              Você pode entrar digitando seu nome de usuário simples ou o endereço de e-mail cadastrado.
                            </p>
                            <ul className="space-y-1.5 text-[11px] text-inverse-on-surface/90">
                              <li className="flex items-center gap-1.5">
                                <span className="text-yellow-300">👦 Filho:</span> Primeiro nome em minúsculo (ex: <strong className="bg-white/15 px-1 py-0.5 rounded text-white font-mono">nome</strong>)
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="text-teal-300">👨‍👩‍👦 Pais:</span> Nome de usuário ou e-mail cadastrado (ex: <strong className="bg-white/15 px-1 py-0.5 rounded text-white font-mono">pais</strong> ou <strong className="bg-white/15 px-1 py-0.5 rounded text-white font-mono">pais@exemplo.com</strong>)
                              </li>
                            </ul>
                            <div className="border-t border-white/10 mt-2.5 pt-2 text-[10px] text-inverse-on-surface/80">
                              💡 Peça aos pais para criarem ou alterarem seu usuário no Painel de Controle se necessário.
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
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
                      placeholder="Digite seu usuário ou e-mail cadastrado"
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
                  className="w-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/95 hover:to-purple-600/95 text-white py-3.5 rounded-full font-black text-xs uppercase tracking-wider mt-1 shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-98 hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] transition-all duration-200 flex items-center justify-center gap-2"
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
                  {loading ? "Criando Avatar..." : "Concluir Cadastro 🎯"}
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
                      Nome de Usuário Cadastrado
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="Ex: bernardo"
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
                    {loading ? "Verificando..." : "Verificar Usuário"}
                  </button>
                </form>
              ) : (
                <div className="text-center flex flex-col gap-4 items-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-on-surface text-sm">Usuário Confirmado!</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed px-2">
                      Sua conta de usuário <strong>{recoveryEmail}</strong> está registrada no sistema. Como este é um portal familiar privado, fale com seu pai (David) ou sua mãe (Beatriz) para verificar ou alterar sua senha diretamente no painel de controle deles!
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

      {/* Interactive "Como funciona" Button */}
      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setShowHowItWorks(true);
          }}
          className="text-xs font-black text-primary/80 hover:text-primary flex items-center gap-1.5 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-all border border-primary/10 hover:border-primary/20 shadow-sm"
        >
          <Lightbulb className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Como funciona nossa jornada?
        </button>
      </div>

      {/* Modern Dialog Modal for Journey Information */}
      <AnimatePresence>
        {showHowItWorks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="how-it-works-modal">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowItWorks(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[420px] bg-surface-container-lowest p-6 rounded-3xl border-2 border-primary/20 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowHowItWorks(false);
                }}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 bg-surface-container hover:bg-surface-container-high rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 mb-3 select-none">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-on-surface tracking-tight">
                  Como Funciona sua Jornada!
                </h3>
                <p className="text-xs text-on-surface-variant max-w-[280px] mt-1 font-semibold">
                  Um portal divertido de hábitos e incentivos para toda a família!
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <span className="text-xl p-1.5 bg-primary/10 rounded-xl">⚡</span>
                  <div>
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                      1. Complete Missões
                    </h4>
                    <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5 leading-relaxed">
                      Faça suas tarefas diárias, dever de casa e hábitos de organização para acumular conquistas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                  <span className="text-xl p-1.5 bg-purple-500/10 rounded-xl">🪙</span>
                  <div>
                    <h4 className="text-xs font-black text-purple-700 uppercase tracking-wider">
                      2. Ganhe Moedas de Ouro
                    </h4>
                    <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5 leading-relaxed">
                      Os pais avaliam e aprovam suas conclusões no Painel deles. Se tudo estiver certo, você ganha seus pontos!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-pink-500/5 border border-pink-500/10">
                  <span className="text-xl p-1.5 bg-pink-500/10 rounded-xl">🎁</span>
                  <div>
                    <h4 className="text-xs font-black text-pink-700 uppercase tracking-wider">
                      3. Resgate Prêmios Épicos
                    </h4>
                    <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5 leading-relaxed">
                      Troque suas moedas por recompensas incríveis escolhidas pelos pais: tempo de tela, lanches ou passeios especiais!
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowHowItWorks(false);
                }}
                className="w-full mt-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white py-3 rounded-full font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-98 transition-all"
              >
                Entendi, Vamos Começar! 🎯
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

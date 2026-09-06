import { ChangeEvent, useState } from "react";
import { Edit, Lock, LogOut, Upload, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authHeaders } from "@/lib/auth";
import UserAvatar from "@/components/UserAvatar";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });

const AuthPanel = () => {
  const { loggedIn, user, setSession, logout } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nickname, setNickname] = useState("");
  const [profileHint, setProfileHint] = useState("");

  const submitAuth = async () => {
    setIsSubmittingAuth(true);
    setAuthError("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");
      setSession(data.token, data.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const saveProfile = async (payload: { displayName?: string; avatar?: string }) => {
    setProfileHint("");
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update profile");
    setSession(data.token, data.user);
  };

  const saveNickname = async () => {
    try {
      await saveProfile({ displayName: nickname.trim() || user?.displayName });
      setEditingName(false);
    } catch (error) {
      setProfileHint(error instanceof Error ? error.message : "Unable to update nickname");
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 800000) {
      setProfileHint("Avatar must be smaller than 800KB / 头像需小于 800KB");
      return;
    }
    try {
      const avatar = await fileToDataUrl(file);
      await saveProfile({ avatar });
    } catch (error) {
      setProfileHint(error instanceof Error ? error.message : "Unable to update avatar");
    }
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-primary" />
        <h4 className="font-body text-sm font-medium text-foreground">Panel de Usuario</h4>
      </div>
      <p className="font-chinese text-xs text-muted-foreground mb-3">用户面板</p>

      {!loggedIn ? (
        <div className="space-y-2.5">
          <div>
            <label className="font-body text-xs text-foreground mb-1 block">
              Cuenta <span className="font-chinese text-muted-foreground">(账号)</span>
            </label>
            <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
              <User className="w-3.5 h-3.5 text-muted-foreground mr-2" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground"
                placeholder="3-20 caracteres / 3-20位账号"
              />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-foreground mb-1 block">
              Contraseña <span className="font-chinese text-muted-foreground">(密码)</span>
            </label>
            <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
              <Lock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground"
                placeholder="至少 8 个字符"
              />
            </div>
          </div>
          <button
            onClick={submitAuth}
            disabled={isSubmittingAuth}
            className="w-full py-2 rounded-lg text-sm font-body hover:opacity-90 transition-colors"
            style={{ backgroundColor: "#711a5f", color: "white" }}
          >
            {isSubmittingAuth ? "…" : authMode === "login" ? "Iniciar sesión · 登录" : "Crear cuenta · 注册"}
          </button>
          {authError && <p className="text-xs text-destructive">{authError}</p>}
          <button
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
            className="w-full text-xs text-primary"
          >
            {authMode === "login" ? "Crear una cuenta · 注册" : "Ya tengo una cuenta · 登录"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={user?.displayName} src={user?.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex gap-1">
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    className="h-8 min-w-0 flex-1 rounded border border-border bg-background px-2 text-sm"
                    maxLength={40}
                  />
                  <button onClick={saveNickname} className="text-xs text-primary">OK</button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="font-body text-sm text-foreground font-medium truncate">{user?.displayName || "Usuario"}</p>
                  <button
                    aria-label="Editar apodo"
                    onClick={() => {
                      setNickname(user?.displayName || "");
                      setEditingName(true);
                    }}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="font-chinese text-xs text-muted-foreground">@{user?.username || "cuenta"}</p>
            </div>
          </div>
          <label className="w-full py-1.5 rounded-lg border border-border text-sm font-body text-muted-foreground hover:border-accent hover:text-accent-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Subir avatar · 上传头像
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadAvatar} />
          </label>
          {profileHint && <p className="text-xs text-destructive">{profileHint}</p>}
          <button
            onClick={logout}
            className="w-full py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm font-body hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión · 退出
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;

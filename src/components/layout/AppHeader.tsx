import { Moon, Sun, Languages, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { META } from "@/data";
import { useNavigate } from "react-router-dom";
import { QrScannerButton } from "@/components/QrScannerButton";
import { OnlineStatus } from "@/components/OnlineStatus";
import sonatrachLogo from "@/assets/sonatrach-logo.png";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b-2 border-accent/30 bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-3 md:px-5 gap-3">
      <SidebarTrigger className="text-foreground hover:text-accent" />
      <img src={sonatrachLogo} alt="Sonatrach" className="h-8 w-auto md:hidden" />
      <div className="hidden md:flex items-center gap-3 min-w-0">
        <img src={sonatrachLogo} alt="Sonatrach" className="h-9 w-auto" />
        <div className="h-6 w-px bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{META.project}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground truncate">{META.location}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <OnlineStatus />
        <Badge variant="outline" className="hidden sm:inline-flex border-accent/40 text-accent bg-accent/10 font-mono text-[10px]">
          {META.process}
        </Badge>
        <QrScannerButton onScan={(id) => navigate(`/equipment/${id}`)} />
        <Button variant="ghost" size="sm" onClick={toggleLang} className="font-mono text-xs gap-1.5">
          <Languages className="h-4 w-4" />
          {lang.toUpperCase()}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user ? (
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 font-mono text-xs" title={user.email ?? ""}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-[8rem]">{user.email}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-1.5 font-mono text-xs">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign in</span>
          </Button>
        )}
      </div>
    </header>
  );
}

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Command, Moon, Sun, Download, Terminal, LayoutDashboard, Component, Box, Activity, BookOpen, ShieldCheck, Zap, BarChart2 } from "lucide-react";
import { useTheme } from "./theme-provider";
import { FULL_MARKDOWN_DOCS } from "@/lib/content";
import { GlobalSearch } from "./search";

export function Layout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const handleDownload = () => {
    const blob = new Blob([FULL_MARKDOWN_DOCS], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proof-of-human-blueprint.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saasNavItems = [
    { href: "/", label: "Product", icon: ShieldCheck },
    { href: "/onboarding", label: "Get Started", icon: Zap },
    { href: "/connect", label: "Dashboard", icon: BarChart2 },
  ];

  const platformNavItems = [
    { href: "/docs", label: "Blueprint", icon: Box },
    { href: "/ops", label: "Ops", icon: Activity },
    { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-primary">
              <Command className="h-5 w-5" />
              <span className="hidden sm:inline-block">Proof of Human</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {saasNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors hover:text-primary ${
                    location === item.href ? "bg-secondary text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
              
              <div className="w-[1px] h-5 bg-border mx-2"></div>
              
              {platformNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-medium px-2 py-1.5 rounded-md transition-colors hover:text-primary ${
                    location === item.href ? "bg-secondary text-primary" : "text-muted-foreground/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-1 flex justify-end md:justify-center">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="hidden md:flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex w-full">
        {children}
      </main>
    </div>
  );
}

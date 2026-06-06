import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { BarChart2, ShieldAlert, BellRing, Plug2, Settings, CreditCard, Building2, FileText, FileBarChart2, User, Menu, X, LogOut, Loader2 } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const navItems = [
  { href: "/connect", label: "Overview", icon: BarChart2 },
  { href: "/risk", label: "Risk & Detection", icon: ShieldAlert },
  { href: "/alerts", label: "Fraud Alerts", icon: BellRing },
  { href: "/integrations", label: "Integrations", icon: Plug2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/logs", label: "Log Explorer", icon: FileText },
  { href: "/reports", label: "Reports", icon: FileBarChart2 },
];

const bottomItems = [
  { href: "/enterprise", label: "Enterprise", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
];

function SignOutConfirmModal({ onConfirm, onCancel, isSigningOut }: { onConfirm: () => void; onCancel: () => void; isSigningOut: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sign out?</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          You'll be returned to the home page and will need to sign in again to access your dashboard.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSigningOut}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NavContent({ location, onClose }: { location: string; onClose?: () => void }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <>
      {showConfirm && (
        <SignOutConfirmModal
          onConfirm={handleSignOut}
          onCancel={() => setShowConfirm(false)}
          isSigningOut={isSigningOut}
        />
      )}

      <div className="flex flex-col h-full">
        <div className="px-3 pt-4 pb-3 border-b border-border/40">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Proof of Human Analytics"
              className="h-[56px] w-auto max-w-[200px]"
              style={{ filter: "hue-rotate(-30deg) saturate(2.5) brightness(1.35)" }}
            />
          </Link>
        </div>
        <nav className="flex-1 px-2 space-y-1 pb-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onClose}
                className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          ))}

          <div className="my-4 border-t border-border/50 mx-2"></div>

          {bottomItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onClose}
                className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-4 border-t border-border/50 pt-4">
          {user && (
            <div className="mb-3">
              <div className="text-xs font-medium text-foreground truncate">
                {user.fullName || user.primaryEmailAddress?.emailAddress || "Account"}
              </div>
              <div className="text-xs text-muted-foreground/60 truncate">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Layout>
      <div className="flex w-full h-full min-h-[calc(100vh-3.5rem)] relative">
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-card border-r border-border z-50
            transform transition-transform duration-200 ease-in-out
            md:relative md:top-0 md:h-auto md:w-56 md:flex-shrink-0 md:translate-x-0 md:block
            ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {drawerOpen && (
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 p-1 rounded-md text-muted-foreground hover:text-foreground md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <NavContent location={location} onClose={() => setDrawerOpen(false)} />
        </aside>

        <main className="flex-1 overflow-auto bg-background/50 relative min-w-0">
          <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          {children}
        </main>
      </div>
    </Layout>
  );
}

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "./logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Weebo Analytics Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/support", label: "Support" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="shrink-0 flex items-center">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const active =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-secondary transition-colors"
            >
              Log In <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/sign-up"
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
            <button
              className="md:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/98 px-4 py-4 flex flex-col gap-1">
            {navLinks.map((item) => {
              const active =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium px-3 py-2.5 rounded-md transition-colors ${
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/40">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium px-3 py-2.5 rounded-md border border-border text-center hover:bg-secondary transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold px-3 py-2.5 rounded-md bg-primary text-primary-foreground text-center hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full">{children}</main>

      <footer className="w-full border-t border-border/40 bg-background/95 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center mb-3">
                <Logo size="sm" />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time bot detection and traffic quality analytics for your
                website.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Product</p>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/features", label: "Features" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/onboarding", label: "Get Started" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Resources</p>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/resources", label: "Documentation" },
                  { href: "/resources", label: "API Reference" },
                  { href: "/resources", label: "Guides" },
                ].map((l, i) => (
                  <Link
                    key={i}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Company</p>
              <div className="flex flex-col gap-2">
                {[{ href: "/support", label: "Support" }].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Account</p>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/sign-in", label: "Log In" },
                  { href: "/sign-up", label: "Sign Up Free" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Proof of Human. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Weebo Analytics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

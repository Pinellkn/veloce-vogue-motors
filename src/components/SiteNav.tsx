import { Link } from "@tanstack/react-router";
import type { PublicUser } from "@/backend/auth";

export function SiteNav({ user }: { user?: PublicUser | null }) {
  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-hairline">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl italic tracking-tight text-ink">
          Veloce.
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-ink transition-colors" hash="inventaire">
              Inventaire
            </Link>
            <Link to="/" className="hover:text-ink transition-colors" hash="services">
              Services
            </Link>
            <Link to="/" className="hover:text-ink transition-colors" hash="vendre">
              Vendre
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full ring-1 ring-primary/20 hover:opacity-90 transition-all"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  search={{ error: undefined }}
                  className="text-sm font-medium px-4 py-2 hover:bg-muted rounded-full transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full ring-1 ring-primary/20 hover:opacity-90 transition-all"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

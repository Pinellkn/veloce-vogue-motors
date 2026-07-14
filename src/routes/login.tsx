import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GoogleButton } from "@/components/GoogleButton";
import heroCar from "@/assets/hero-car.jpg";
import { useState, type FormEvent } from "react";
import { loginUser } from "@/backend/functions/auth";

const googleErrorMessages: Record<string, string> = {
  google_denied: "Connexion Google annulée.",
  google_invalid: "Réponse Google invalide, merci de réessayer.",
  google_failed: "La connexion avec Google a échoué. Réessayez.",
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion — Veloce" },
      { name: "description", content: "Accédez à votre espace Veloce." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { error: googleError } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    googleError ? googleErrorMessages[googleError] ?? "Connexion Google échouée." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginUser({ data: { email, password } });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      {/* Visuel gauche */}
      <div className="hidden lg:block relative overflow-hidden">
        <img src={heroCar} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-8 left-8">
          <Link to="/" className="font-serif text-3xl italic text-white">
            Veloce.
          </Link>
        </div>
        <div className="absolute bottom-12 left-8 right-8">
          <p className="font-serif italic text-3xl text-white max-w-md leading-tight">
            "Chaque véhicule est une histoire. Nous vous aidons à écrire la vôtre."
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-white/60">
            — Équipe Veloce
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="lg:hidden font-serif text-2xl italic block mb-10"
          >
            Veloce.
          </Link>
          <h1 className="font-serif text-4xl italic text-balance">Bon retour parmi nous.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous pour retrouver vos favoris et alertes.
          </p>

          {error && (
            <div className="mt-6 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="mt-8">
            <GoogleButton label="Continuer avec Google" />
          </div>

          <div className="relative flex items-center my-8">
            <div className="flex-grow border-t border-hairline"></div>
            <span className="mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">
              ou par e-mail
            </span>
            <div className="flex-grow border-t border-hairline"></div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full text-sm py-3 px-4 bg-white rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium">Mot de passe</label>
                <a href="#" className="text-xs text-muted-foreground hover:text-ink">
                  Oublié ?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm py-3 px-4 bg-white rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-ink font-medium underline underline-offset-4">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

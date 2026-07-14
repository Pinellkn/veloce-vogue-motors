import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GoogleButton } from "@/components/GoogleButton";
import carFerrari from "@/assets/car-ferrari.jpg";
import { useState, type FormEvent } from "react";
import { registerUser } from "@/backend/functions/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Inscription — Veloce" },
      { name: "description", content: "Créez votre compte Veloce et rejoignez le cercle." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerUser({ data: form });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      {/* Formulaire */}
      <div className="flex items-center justify-center px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="font-serif text-2xl italic block mb-10"
          >
            Veloce.
          </Link>
          <h1 className="font-serif text-4xl italic text-balance">Rejoignez le cercle.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ventes privées, alertes, messagerie — accédez au meilleur de Veloce.
          </p>

          {error && (
            <div className="mt-6 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="mt-8">
            <GoogleButton label="S'inscrire avec Google" />
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
              <label className="text-xs font-medium block mb-1.5">Nom complet</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Marc Dubois"
                className="w-full text-sm py-3 px-4 bg-white rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@exemple.com"
                className="w-full text-sm py-3 px-4 bg-white rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5">Mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Au moins 8 caractères"
                className="w-full text-sm py-3 px-4 bg-white rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              En créant un compte, vous acceptez nos{" "}
              <a href="#" className="underline">conditions d'utilisation</a> et notre{" "}
              <a href="#" className="underline">politique de confidentialité</a>.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" search={{ error: undefined }} className="text-ink font-medium underline underline-offset-4">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>

      {/* Visuel droite */}
      <div className="hidden lg:block relative overflow-hidden order-1 lg:order-2">
        <img src={carFerrari} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-bl from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-8 right-8">
          <p className="font-serif italic text-3xl text-white max-w-md leading-tight">
            "Un compte, une collection, un service à la hauteur."
          </p>
        </div>
      </div>
    </div>
  );
}

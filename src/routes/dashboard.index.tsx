import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageSquare, Search, TrendingDown, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/backend/functions/dashboard";
import { listFavorites } from "@/backend/functions/cars";
import { getCarImage, formatPrice, formatDateTime } from "@/lib/car-images";

export const Route = createFileRoute("/dashboard/")({
  loader: async () => {
    const [dashboard, favorites] = await Promise.all([
      getDashboardStats(),
      listFavorites(),
    ]);
    return { dashboard, favorites: favorites.slice(0, 4) };
  },
  component: DashboardHome,
});

const statIcons = [Heart, Search, MessageSquare, TrendingDown];

function DashboardHome() {
  const { dashboard, favorites } = Route.useLoaderData();

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            Bienvenue
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Bonjour.</h1>
          <p className="text-muted-foreground mt-2">
            Voici l'activité de votre collection cette semaine.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.stats.map((s, i) => {
          const Icon = statIcons[i] ?? Heart;
          return (
            <div
              key={s.label}
              className="bg-white p-6 rounded-2xl ring-1 ring-hairline hover:ring-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="font-serif text-4xl mt-2">
                    {String(s.value).padStart(2, "0")}
                  </p>
                </div>
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid activity + saved */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activité */}
        <div className="lg:col-span-1 bg-white rounded-2xl ring-1 ring-hairline p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl">Activité</h2>
            <Link to="/dashboard/history" className="text-xs text-muted-foreground hover:text-ink">
              Tout voir
            </Link>
          </div>
          {dashboard.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune activité pour le moment. Ajoutez des favoris pour commencer.
            </p>
          ) : (
            <div className="space-y-4">
              {dashboard.recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className={`size-8 rounded-full grid place-items-center shrink-0 ${
                      a.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-ink"
                    }`}
                  >
                    {a.status === "done" ? (
                      <TrendingUp className="size-4" />
                    ) : (
                      <TrendingDown className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(a.meta)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favoris */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-hairline p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl">Vos favoris</h2>
            <Link
              to="/dashboard/favorites"
              className="text-xs text-muted-foreground hover:text-ink flex items-center gap-1"
            >
              Tout voir
            </Link>
          </div>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas encore de favoris. Parcourez le catalogue depuis la page d'accueil.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {favorites.map((v) => (
                <div key={v.id} className="group cursor-pointer">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-hairline mb-3">
                    <img
                      src={getCarImage(v.imageKey)}
                      alt={v.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.specs}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0 ml-2">{formatPrice(v.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

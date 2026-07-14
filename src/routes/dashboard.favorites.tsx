import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";
import { listFavorites, toggleFavorite } from "@/backend/functions/cars";
import { getCarImage, formatPrice, formatDate } from "@/lib/car-images";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/favorites")({
  loader: () => listFavorites(),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favorites = Route.useLoaderData();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRemove(carId: string) {
    setPendingId(carId);
    try {
      await toggleFavorite({ data: { carId } });
      await router.invalidate();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            {favorites.length} véhicule{favorites.length > 1 ? "s" : ""}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Vos favoris.</h1>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-hairline p-12 text-center">
          <Heart className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucun favori pour le moment. Ajoutez des véhicules depuis la page d'accueil.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((v) => (
            <article
              key={v.id}
              className="bg-white rounded-2xl ring-1 ring-hairline overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                <img
                  src={getCarImage(v.imageKey)}
                  alt={v.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={() => handleRemove(v.id)}
                  disabled={pendingId === v.id}
                  className="absolute top-3 right-3 size-9 grid place-items-center rounded-full bg-white/90 backdrop-blur ring-1 ring-hairline hover:bg-white disabled:opacity-50"
                  title="Retirer des favoris"
                >
                  <Heart className="size-4 fill-destructive text-destructive" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-medium">{v.name}</h3>
                  <span className="font-serif text-lg">{formatPrice(v.price)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{v.specs}</p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-hairline">
                  <p className="text-xs text-muted-foreground">
                    Ajouté le {formatDate(v.favoritedAt)}
                  </p>
                  <button
                    onClick={() => handleRemove(v.id)}
                    disabled={pendingId === v.id}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

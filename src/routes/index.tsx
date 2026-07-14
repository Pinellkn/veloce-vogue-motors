import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import heroCar from "@/assets/hero-car.jpg";
import carUtility from "@/assets/car-utility.jpg";
import { Heart } from "lucide-react";
import { useState } from "react";
import { getCurrentUser } from "@/backend/functions/auth";
import { listCategories, listFavoriteIds, listFeaturedCars, searchCars, type CarDTO } from "@/backend/functions/cars";
import { toggleFavorite } from "@/backend/functions/cars";
import { getCarImage, formatPrice } from "@/lib/car-images";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [user, cars, categories] = await Promise.all([
      getCurrentUser(),
      listFeaturedCars(),
      listCategories(),
    ]);
    const favoriteIds = user ? await listFavoriteIds() : [];
    return { user, cars, categories, favoriteIds };
  },
  head: () => ({
    meta: [
      { title: "Veloce — L'excellence automobile, sans compromis" },
      {
        name: "description",
        content:
          "Marketplace premium de véhicules d'exception : sportives, SUV, électriques, motos, utilitaires. Une sélection curatée pour les passionnés.",
      },
      { property: "og:title", content: "Veloce — L'excellence automobile" },
      {
        property: "og:description",
        content: "Sélection curatée de véhicules premium — sportives, SUV, électriques, motos.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, cars, categories, favoriteIds } = Route.useLoaderData();
  const navigate = useNavigate();

  const [results, setResults] = useState<CarDTO[] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoriteIds));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous types");
  const [maxPrice, setMaxPrice] = useState("");
  const [searching, setSearching] = useState(false);

  const displayed = results ?? cars;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const found = await searchCars({
        data: {
          query: query || undefined,
          category: category !== "Tous types" ? category : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        },
      });
      setResults(found);
    } finally {
      setSearching(false);
    }
  }

  async function handleToggleFavorite(carId: string) {
    if (!user) {
      navigate({ to: "/login", search: { error: undefined } });
      return;
    }
    const wasFavorited = favorites.has(carId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(carId);
      else next.add(carId);
      return next;
    });
    await toggleFavorite({ data: { carId } });
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteNav user={user} />

      {/* HERO — vidéo cinématique en arrière-plan */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover animate-ken-burns"
            autoPlay
            loop
            muted
            playsInline
            poster={heroCar}
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-luxury-car-driving-through-a-tunnel-33701-large.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-surface" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-40">
          <div className="max-w-3xl animate-fade-up">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/70 mb-6">
              Marketplace automobile · France
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-white text-balance">
              L'excellence automobile,
              <br />
              <span className="italic text-white/60">sans compromis.</span>
            </h1>
            <p className="mt-8 text-lg text-white/70 max-w-xl text-pretty">
              Sportives, SUV, électriques, motos, utilitaires — une sélection curatée des plus
              belles machines du marché, livrée avec l'exigence d'une conciergerie.
            </p>
          </div>

          {/* Barre de recherche premium */}
          <form
            onSubmit={handleSearch}
            className="relative z-10 mt-16 animate-fade-up [animation-delay:200ms]"
          >
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl ring-1 ring-black/5 shadow-2xl grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <div className="p-3">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Marque & modèle
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Porsche 911..."
                  className="w-full text-sm font-medium outline-none bg-transparent placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="p-3 md:border-l border-hairline">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm font-medium outline-none bg-transparent"
                >
                  <option>Tous types</option>
                  {categories.map((c) => (
                    <option key={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="p-3 md:border-l border-hairline">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Budget max
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-sm font-medium outline-none bg-transparent"
                >
                  <option value="">Sans limite</option>
                  <option value="50000">50.000 €</option>
                  <option value="100000">100.000 €</option>
                  <option value="250000">250.000 €</option>
                  <option value="500000">500.000 €</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-primary text-primary-foreground text-sm font-medium px-8 py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {searching ? "Recherche…" : "Rechercher"}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* CATÉGORIES */}
      <section id="inventaire" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mb-3">
                Explorer par catégorie
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-balance">
                Chaque passion,
                <span className="italic text-muted-foreground"> son terrain.</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  setCategory(c.label);
                  searchCars({ data: { category: c.label } }).then(setResults);
                }}
                className="group border border-hairline rounded-2xl p-6 hover:border-ink/30 hover:-translate-y-1 transition-all bg-white text-left"
              >
                <p className="font-serif text-2xl">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {c.count} véhicule{c.count > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SÉLECTION DE PRESTIGE */}
      <section className="py-24 px-6 bg-white border-y border-hairline">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mb-3">
                {results ? "Résultats de recherche" : "Sélection du mois"}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-balance">
                {results ? (
                  <>
                    {results.length} véhicule{results.length > 1 ? "s" : ""} <span className="italic">trouvé{results.length > 1 ? "s" : ""}.</span>
                  </>
                ) : (
                  <>Sélection de <span className="italic">prestige.</span></>
                )}
              </h2>
            </div>
            {results && (
              <button
                onClick={() => setResults(null)}
                className="hidden md:inline text-sm font-medium border-b border-ink/20 pb-1 hover:border-ink transition-colors"
              >
                ← Revenir à la sélection
              </button>
            )}
          </div>

          {displayed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun véhicule ne correspond à ces critères.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayed.map((v) => (
                <article key={v.id} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden ring-1 ring-hairline mb-4">
                    <img
                      src={getCarImage(v.imageKey)}
                      alt={v.name}
                      loading="lazy"
                      width={1200}
                      height={900}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    {v.tag && (
                      <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-wider bg-white/95 backdrop-blur px-3 py-1 rounded-full">
                        {v.tag}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleFavorite(v.id);
                      }}
                      className="absolute top-4 right-4 size-9 grid place-items-center rounded-full bg-white/90 backdrop-blur ring-1 ring-hairline hover:bg-white"
                      title="Ajouter aux favoris"
                    >
                      <Heart
                        className={`size-4 ${
                          favorites.has(v.id) ? "fill-destructive text-destructive" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{v.name}</h3>
                      <p className="text-sm text-muted-foreground">{v.specs}</p>
                    </div>
                    <span className="font-serif text-xl">{formatPrice(v.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SERVICES / CONFIANCE */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mb-3">
              Services & garanties
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">
              Une conciergerie,
              <br />
              <span className="italic text-muted-foreground">pas un catalogue.</span>
            </h2>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                n: "01",
                t: "Expertise mécanique",
                d: "Chaque véhicule inspecté sur 250 points par nos ingénieurs partenaires.",
              },
              {
                n: "02",
                t: "Livraison à domicile",
                d: "Transport bâché dans toute l'Europe. Remise en main propre.",
              },
              {
                n: "03",
                t: "Financement sur mesure",
                d: "Crédit-bail, LOA, achat comptant — nos experts structurent l'offre.",
              },
              {
                n: "04",
                t: "Garantie 24 mois",
                d: "Sur pièces mécaniques et électroniques, extensible jusqu'à 5 ans.",
              },
            ].map((s) => (
              <div key={s.n} className="border-t border-hairline pt-6">
                <p className="font-serif text-2xl italic text-muted-foreground/60">{s.n}</p>
                <h3 className="mt-3 text-lg font-medium">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA membres */}
      {!user && (
        <section id="vendre" className="py-24 px-6 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-primary-foreground/60 mb-4">
                Rejoignez Veloce
              </p>
              <h2 className="font-serif text-4xl md:text-6xl text-balance leading-tight">
                Créez votre compte,
                <br />
                <span className="italic text-primary-foreground/60">
                  accédez au cercle.
                </span>
              </h2>
              <p className="mt-6 text-primary-foreground/70 max-w-xl text-pretty">
                Ventes privées, alertes personnalisées, historique de recherche, messagerie
                directe avec les vendeurs. Tout ce qu'il faut pour trouver la bonne voiture.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-white text-ink text-sm font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
              >
                Créer un compte
              </Link>
              <Link
                to="/login"
                search={{ error: undefined }}
                className="inline-flex items-center justify-center border border-white/20 text-primary-foreground text-sm font-medium px-8 py-4 rounded-full hover:bg-white/10 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Utilitaire preview */}
      <section className="py-24 px-6 bg-white border-t border-hairline">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-hairline">
            <img src={carUtility} alt="Utilitaire" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mb-3">
              Aussi pour les pros
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">
              Utilitaires & flottes,
              <br />
              <span className="italic text-muted-foreground">gérés de A à Z.</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-xl text-pretty">
              Devis multi-véhicules, personnalisation, entretien programmé et rachat en fin de
              cycle. Une équipe dédiée aux comptes entreprises.
            </p>
            <a
              href="#"
              className="inline-block mt-8 text-sm font-medium border-b border-ink/20 pb-1 hover:border-ink transition-colors"
            >
              Contacter l'équipe pro →
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

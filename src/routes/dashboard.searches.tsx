import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bell, BellOff, Search, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  createSearch,
  deleteSearch,
  listSearches,
  toggleSearchAlert,
} from "@/backend/functions/dashboard";
import { listCategories } from "@/backend/functions/cars";

export const Route = createFileRoute("/dashboard/searches")({
  loader: async () => {
    const [searches, categories] = await Promise.all([listSearches(), listCategories()]);
    return { searches, categories };
  },
  component: SearchesPage,
});

function SearchesPage() {
  const { searches, categories } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", category: "", maxPrice: "" });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createSearch({
        data: {
          label: form.label,
          category: form.category || undefined,
          maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        },
      });
      setForm({ label: "", category: "", maxPrice: "" });
      setShowForm(false);
      await router.invalidate();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    await toggleSearchAlert({ data: { id } });
    await router.invalidate();
  }

  async function handleDelete(id: string) {
    await deleteSearch({ data: { id } });
    await router.invalidate();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            {searches.length} recherche{searches.length > 1 ? "s" : ""} enregistrée{searches.length > 1 ? "s" : ""}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Mes recherches.</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full"
        >
          {showForm ? <X className="size-4" /> : <Search className="size-4" />}
          {showForm ? "Annuler" : "Nouvelle recherche"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl ring-1 ring-hairline p-6 mb-6 grid sm:grid-cols-4 gap-4 items-end"
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-medium block mb-1.5">Nom de la recherche</label>
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex : Porsche 911 GT3"
              className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:outline-none"
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Budget max (€)</label>
            <input
              type="number"
              value={form.maxPrice}
              onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
              placeholder="200000"
              className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer la recherche"}
            </button>
          </div>
        </form>
      )}

      {searches.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-hairline p-12 text-center">
          <Search className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucune recherche enregistrée. Créez-en une pour recevoir des alertes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-hairline divide-y divide-hairline">
          {searches.map((s) => (
            <div
              key={s.id}
              className="p-6 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.filtersLabel}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="font-serif text-2xl">{s.matches}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  résultats
                </p>
              </div>
              <button
                onClick={() => handleToggle(s.id)}
                className={`size-10 rounded-full grid place-items-center ring-1 transition-colors ${
                  s.alert
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-white text-muted-foreground ring-hairline hover:bg-muted"
                }`}
                title={s.alert ? "Alertes activées" : "Alertes désactivées"}
              >
                {s.alert ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="size-10 rounded-full grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

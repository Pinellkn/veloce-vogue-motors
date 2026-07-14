import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  createCarAdmin,
  deleteCarAdmin,
  listAllCarsAdmin,
  updateCarAdmin,
} from "@/backend/functions/admin";
import { listCategories } from "@/backend/functions/cars";
import { AVAILABLE_CAR_IMAGE_KEYS, formatPrice, getCarImage } from "@/lib/car-images";

export const Route = createFileRoute("/admin/cars")({
  loader: async () => {
    const [cars, categories] = await Promise.all([listAllCarsAdmin(), listCategories()]);
    return { cars, categories };
  },
  component: AdminCarsPage,
});

type CarFormState = {
  id?: string;
  brand: string;
  model: string;
  category: string;
  fuelType: string;
  year: string;
  price: string;
  powerCh: string;
  tag: string;
  imageKey: string;
  description: string;
};

const emptyForm: CarFormState = {
  brand: "",
  model: "",
  category: "",
  fuelType: "Essence",
  year: String(new Date().getFullYear()),
  price: "",
  powerCh: "",
  tag: "",
  imageKey: AVAILABLE_CAR_IMAGE_KEYS[0],
  description: "",
};

function AdminCarsPage() {
  const { cars, categories } = Route.useLoaderData();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CarFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEdit(car: (typeof cars)[number]) {
    setForm({
      id: car.id,
      brand: car.brand,
      model: car.model,
      category: car.category,
      fuelType: car.fuelType,
      year: String(car.year),
      price: String(car.price),
      powerCh: car.powerCh ? String(car.powerCh) : "",
      tag: car.tag ?? "",
      imageKey: car.imageKey,
      description: car.description ?? "",
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category.trim(),
        fuelType: form.fuelType.trim(),
        year: Number(form.year),
        price: Number(form.price),
        powerCh: form.powerCh ? Number(form.powerCh) : undefined,
        tag: form.tag.trim() || undefined,
        imageKey: form.imageKey,
        description: form.description.trim() || undefined,
      };

      if (form.id) {
        await updateCarAdmin({ data: { ...payload, id: form.id } });
      } else {
        await createCarAdmin({ data: payload });
      }
      setShowForm(false);
      setForm(emptyForm);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" du catalogue ?`)) return;
    setPendingId(id);
    try {
      await deleteCarAdmin({ data: { id } });
      await router.invalidate();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            {cars.length} véhicule{cars.length > 1 ? "s" : ""} au catalogue
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Véhicules.</h1>
        </div>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full"
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Annuler" : "Ajouter un véhicule"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl ring-1 ring-hairline p-6 mb-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Marque" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} required />
            <TextField label="Modèle" value={form.model} onChange={(v) => setForm({ ...form, model: v })} required />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5">Catégorie</label>
              <input
                required
                list="categories-list"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Sportives, SUV, Motos…"
                className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none"
              />
              <datalist id="categories-list">
                {categories.map((c) => (
                  <option key={c.label} value={c.label} />
                ))}
              </datalist>
            </div>
            <TextField label="Carburant" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} required />
            <TextField label="Année" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" required />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <TextField label="Prix (€)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" required />
            <TextField label="Puissance (ch, optionnel)" value={form.powerCh} onChange={(v) => setForm({ ...form, powerCh: v })} type="number" />
            <TextField label="Badge (optionnel)" value={form.tag} onChange={(v) => setForm({ ...form, tag: v })} placeholder="Nouveau, Certifié…" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Image</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {AVAILABLE_CAR_IMAGE_KEYS.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setForm({ ...form, imageKey: key })}
                  className={`aspect-[4/3] rounded-lg overflow-hidden ring-2 transition-all ${
                    form.imageKey === key ? "ring-primary" : "ring-transparent hover:ring-hairline"
                  }`}
                >
                  <img src={getCarImage(key)} alt={key} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : form.id ? "Mettre à jour" : "Ajouter au catalogue"}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <article key={car.id} className="bg-white rounded-2xl ring-1 ring-hairline overflow-hidden">
            <div className="aspect-[4/3] bg-muted">
              <img src={getCarImage(car.imageKey)} alt={car.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium">{car.name}</h3>
                <span className="font-serif">{formatPrice(car.price)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {car.category} · {car.fuelType} · {car.year}
              </p>
              <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-hairline">
                <button
                  onClick={() => openEdit(car)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-ink hover:bg-muted transition-colors"
                  title="Modifier"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(car.id, car.name)}
                  disabled={pendingId === car.id}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 disabled:opacity-30 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm py-2.5 px-3 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none"
      />
    </div>
  );
}

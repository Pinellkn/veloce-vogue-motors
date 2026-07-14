import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { deleteAccount, updateProfile } from "@/backend/functions/dashboard";
import { formatDate } from "@/lib/car-images";

export const Route = createFileRoute("/dashboard/profile")({
  loader: ({ context }) => context.user,
  component: ProfilePage,
});

function ProfilePage() {
  const user = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    city: user.city ?? "",
    country: user.country ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ data: form });
      setSaved(true);
      await router.invalidate();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Supprimer définitivement votre compte ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      await deleteAccount();
      navigate({ to: "/" });
    } finally {
      setDeleting(false);
    }
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
          Informations personnelles
        </p>
        <h1 className="font-serif text-4xl md:text-5xl italic">Profil.</h1>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl ring-1 ring-hairline p-6 mb-6 flex items-center gap-5">
        <div className="size-16 rounded-full bg-primary text-primary-foreground grid place-items-center font-serif text-2xl italic overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">Membre depuis {formatDate(user.createdAt)}</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl ring-1 ring-hairline p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nom complet" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Adresse e-mail" value={user.email} onChange={() => {}} disabled />
        </div>
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Pays" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
          {saved && <p className="text-xs text-emerald-700 mr-auto">Profil mis à jour.</p>}
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-6 bg-white rounded-2xl ring-1 ring-hairline p-8">
        <h3 className="font-medium mb-1">Zone sensible</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Supprimer définitivement votre compte et vos données.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="text-sm font-medium border border-destructive/30 text-destructive px-5 py-2.5 rounded-full hover:bg-destructive/5 disabled:opacity-60"
        >
          {deleting ? "Suppression…" : "Supprimer mon compte"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm py-3 px-4 bg-surface rounded-lg ring-1 ring-hairline focus:ring-primary focus:outline-none transition-shadow disabled:opacity-60"
      />
    </div>
  );
}

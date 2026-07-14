import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Shield, ShieldOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteUserAdmin, listAllUsersAdmin, toggleUserAdminRole } from "@/backend/functions/admin";
import { formatDate } from "@/lib/car-images";

export const Route = createFileRoute("/admin/users")({
  loader: () => listAllUsersAdmin(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const users = Route.useLoaderData();
  const currentAdmin = Route.useRouteContext({ select: (c) => c.user });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggleAdmin(userId: string) {
    setError(null);
    setPendingId(userId);
    try {
      await toggleUserAdminRole({ data: { userId } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Supprimer définitivement le compte de ${name} ? Cette action est irréversible.`)) {
      return;
    }
    setError(null);
    setPendingId(userId);
    try {
      await deleteUserAdmin({ data: { userId } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
          {users.length} compte{users.length > 1 ? "s" : ""}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl italic">Utilisateurs.</h1>
      </div>

      {error && (
        <div className="mb-6 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl ring-1 ring-hairline overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              <th className="text-left px-6 py-4">Nom</th>
              <th className="text-left px-6 py-4">E-mail</th>
              <th className="text-left px-6 py-4">Connexion</th>
              <th className="text-left px-6 py-4">Favoris</th>
              <th className="text-left px-6 py-4">Recherches</th>
              <th className="text-left px-6 py-4">Inscrit le</th>
              <th className="text-left px-6 py-4">Rôle</th>
              <th className="text-right px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users.map((u) => {
              const isSelf = u.id === currentAdmin.id;
              return (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">
                    {u.name} {isSelf && <span className="text-muted-foreground">(toi)</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{u.provider}</td>
                  <td className="px-6 py-4 text-sm">{u.favoritesCount}</td>
                  <td className="px-6 py-4 text-sm">{u.searchesCount}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${
                        u.isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.isAdmin ? "Admin" : "Membre"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleAdmin(u.id)}
                        disabled={isSelf || pendingId === u.id}
                        title={u.isAdmin ? "Retirer le rôle admin" : "Passer admin"}
                        className="p-2 rounded-lg text-muted-foreground hover:text-ink hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        {u.isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={isSelf || pendingId === u.id}
                        title="Supprimer le compte"
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Users, Car, Heart, MessageSquare } from "lucide-react";
import { getAdminStats } from "@/backend/functions/admin";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStats(),
  component: AdminHome,
});

const icons = [Users, Car, Heart, MessageSquare];

function AdminHome() {
  const { stats, adminsCount } = Route.useLoaderData();

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
          Administration
        </p>
        <h1 className="font-serif text-4xl md:text-5xl italic">Vue d'ensemble.</h1>
        <p className="text-muted-foreground mt-2">
          {adminsCount} administrateur{adminsCount > 1 ? "s" : ""} sur la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = icons[i] ?? Users;
          return (
            <div key={s.label} className="bg-white p-6 rounded-2xl ring-1 ring-hairline">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="font-serif text-4xl mt-2">{s.value}</p>
                </div>
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

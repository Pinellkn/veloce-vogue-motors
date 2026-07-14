import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, History as HistoryIcon, XCircle } from "lucide-react";
import { listHistory } from "@/backend/functions/dashboard";
import { formatDate } from "@/lib/car-images";

export const Route = createFileRoute("/dashboard/history")({
  loader: () => listHistory(),
  component: HistoryPage,
});

const badge = {
  done: { text: "Complété", icon: CheckCircle2, className: "text-emerald-700 bg-emerald-100" },
  pending: { text: "En cours", icon: Clock, className: "text-amber-700 bg-amber-100" },
  cancelled: { text: "Annulé", icon: XCircle, className: "text-muted-foreground bg-muted" },
};

function HistoryPage() {
  const history = Route.useLoaderData();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
          Journal d'activité
        </p>
        <h1 className="font-serif text-4xl md:text-5xl italic">Historique.</h1>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-hairline p-12 text-center">
          <HistoryIcon className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucune activité enregistrée pour le moment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-hairline overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                <th className="text-left px-6 py-4">Date</th>
                <th className="text-left px-6 py-4">Véhicule</th>
                <th className="text-left px-6 py-4">Action</th>
                <th className="text-left px-6 py-4">Statut</th>
                <th className="text-right px-6 py-4">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {history.map((h, i) => {
                const b = badge[h.status];
                const Icon = b.icon;
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(h.date)}</td>
                    <td className="px-6 py-4 text-sm font-medium">{h.vehicle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{h.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${b.className}`}
                      >
                        <Icon className="size-3" />
                        {b.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-serif text-right">{h.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

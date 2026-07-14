import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Car, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/backend/functions/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { error: undefined } });
    }
    if (!user.isAdmin) {
      throw redirect({ to: "/dashboard" });
    }
    return { user };
  },
  loader: ({ context }) => context.user,
  head: () => ({
    meta: [
      { title: "Administration — Veloce" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/cars", label: "Véhicules", icon: Car },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-hairline bg-white sticky top-0 h-screen">
        <div className="px-6 h-16 flex items-center border-b border-hairline">
          <Link to="/" className="font-serif text-2xl italic">
            Veloce<span className="text-muted-foreground text-base not-italic"> · admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-ink"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-hairline">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink px-3 py-2"
          >
            <ArrowLeft className="size-4" />
            Retour à mon espace
          </Link>
          <p className="px-3 text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

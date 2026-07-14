export function SiteFooter() {
  return (
    <footer className="py-16 border-t border-hairline px-6 bg-surface">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2 space-y-4">
          <span className="font-serif text-3xl italic text-ink">Veloce.</span>
          <p className="text-sm text-muted-foreground max-w-[48ch] text-pretty">
            Curateurs de l'automobile d'exception depuis 2024. Le service au service de la
            passion.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Navigation
          </p>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-muted-foreground transition-colors">Stock</a></li>
            <li><a href="#" className="hover:text-muted-foreground transition-colors">Conciergerie</a></li>
            <li><a href="#" className="hover:text-muted-foreground transition-colors">Financement</a></li>
            <li><a href="#" className="hover:text-muted-foreground transition-colors">Blog</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Contact
          </p>
          <ul className="space-y-2 text-sm">
            <li>Paris, France</li>
            <li>+33 1 23 45 67 89</li>
            <li>contact@veloce.fr</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-hairline flex flex-col md:flex-row justify-between text-xs text-muted-foreground">
        <p>© 2026 Veloce. Tous droits réservés.</p>
        <p>Mentions légales · Politique de confidentialité</p>
      </div>
    </footer>
  );
}

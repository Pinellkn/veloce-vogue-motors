# Backend Veloce — Guide d'installation

Le backend est intégré directement au projet React (TanStack Start = React +
serveur dans le même projet, comme Next.js). Pas de serveur séparé à lancer :
tout tourne avec `npm run dev`.

## Ce qui a été ajouté

- **Base de données** : SQLite (fichier `data/veloce.db`, créé automatiquement,
  zéro configuration — pas besoin de XAMPP/MySQL pour ce projet).
- **Authentification e-mail/mot de passe** : inscription, connexion, session
  sécurisée (cookie chiffré httpOnly).
- **Connexion Google (OAuth réel)** avec tes identifiants.
- **Favoris, recherches enregistrées, messagerie, historique, profil** :
  tout est branché sur la vraie base de données (fini les fausses données en dur).
- **Page d'accueil** : véhicules et compteurs de catégories réels, recherche
  fonctionnelle (filtre par marque/modèle, catégorie, budget).

## Espace admin

Le tout premier compte créé sur le site (inscription e-mail ou Google) devient
**automatiquement administrateur**. Une fois connecté avec ce compte, un lien
« Administration » apparaît en bas de la barre latérale du tableau de bord,
menant vers `/admin` :

- **Utilisateurs** : liste de tous les comptes, nombre de favoris/recherches,
  promotion/rétrogradation du rôle admin, suppression de compte.
- **Véhicules** : ajout, modification, suppression des véhicules du catalogue
  (marque, modèle, catégorie, prix, image, etc.).

Pour donner le rôle admin à un compte existant (par exemple pour ajouter un
2e admin), lance :
```
node scripts/make-admin.mjs email@exemple.com
```
(le compte doit déjà exister — il suffit qu'il se soit inscrit une première fois).

## Installation

1. **Installer les dépendances** (si pas déjà fait) :
   ```
   npm install
   ```

2. **Fichier `.env`** : déjà créé à la racine avec tes identifiants Google et une
   clé de session générée automatiquement. Si tu le perds, recopie
   `.env.example` et régénère une clé avec :
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Lancer le serveur** :
   ```
   npm run dev
   ```
   Regarde bien le port affiché dans le terminal (en général `8080`, ex :
   `http://localhost:8080`). C'est important pour l'étape Google ci-dessous.

## Configuration Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services
→ Identifiants → ton client OAuth, ajoute :

- **Origine JavaScript autorisée** :
  `http://localhost:8080`
- **URI de redirection autorisé** :
  `http://localhost:8080/auth/google/callback`

⚠️ Remplace `8080` par le port réellement affiché par `npm run dev` s'il est
différent. Si un jour tu déploies le site (autre domaine), il faudra ajouter
aussi l'URL de production dans ces deux champs, et mettre à jour `APP_ORIGIN`
dans `.env` sur le serveur de production.

## Structure du backend

```
src/server/
  db.ts                    # connexion SQLite + création des tables + données de départ
  auth.ts                  # session chiffrée, hash mot de passe
  google-oauth.ts          # échanges avec l'API Google
  functions/
    auth.ts                # inscription, connexion, déconnexion, Google OAuth
    cars.ts                # véhicules, favoris, recherche
    dashboard.ts           # stats, recherches enregistrées, messages, historique, profil
```

Toutes ces fonctions sont des **server functions** TanStack Start
(`createServerFn`) : du code qui ne s'exécute JAMAIS dans le navigateur, appelé
depuis les pages React comme de simples fonctions async, sans écrire d'API
REST à la main.

## Notes importantes

- Le fichier `data/veloce.db` (et `.env`) ne sont volontairement pas suivis
  par Git (`.gitignore`), car ils contiennent des données/secrets locaux.
- Un nouveau compte reçoit un message de bienvenue dans sa messagerie pour ne
  pas démarrer sur une page totalement vide.
- Pour repartir de zéro : arrête le serveur, supprime le dossier `data/`, puis
  relance `npm run dev` — la base sera recréée et re-seedée avec les 7
  véhicules de démonstration.

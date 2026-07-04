## Point 4 — Confort d'usage et inclusion

Objectif : réduire la friction pour publier et rendre la lecture plus fluide, surtout pour les nouveaux membres.

### 1. Onboarding guidé (nouveau)
Après la première connexion, un assistant en 3 étapes s'affiche en overlay :
- Choix de 3 à 10 tags d'intérêt (utilisés plus tard pour personnaliser le fil).
- Complétion express du profil (bio courte, stack, pays).
- Mini-tour de la plateforme (poser une question, rejoindre une communauté, badges).
Skippable à tout moment. État stocké côté serveur (`profiles.onboarding_done`) pour ne plus s'afficher.

### 2. Brouillons automatiques
Sauvegarde locale (localStorage) toutes les 2 s lors de la rédaction :
- Question / News / Discussion (`/ask`)
- Réponse (`QuestionDetail`)
Bandeau « Brouillon restauré » avec bouton « Repartir de zéro ». Purge après publication.

### 3. Mode "question gentille" (assistant IA)
Bouton « Améliorer avec l'IA » sur `/ask` (via Lovable AI Gateway, modèle gratuit `google/gemini-2.5-flash`) :
- Reformule le titre pour plus de clarté.
- Signale contexte manquant (versions, message d'erreur, ce qui a été essayé).
- Détecte les blocs de code non formatés et propose la mise en forme.
Résultat proposé dans un panneau latéral, l'utilisateur applique ou ignore.

### 4. Tags suggérés automatiquement
Bouton « Suggérer des tags » à côté du champ tags : envoie titre + extrait du corps à l'IA, retourne 3-5 tags choisis parmi ceux existants (fallback : création libre). Un clic pour ajouter.

### 5. Aperçu Markdown côte-à-côte
Sur les éditeurs Markdown existants, ajout d'un switch trois positions : Éditer / Split / Aperçu. Split affiche l'aperçu synchronisé à droite. Preference retenue en localStorage.

### 6. Recherche améliorée + filtres
Refonte de la page résultats (via `?search=`) :
- Filtres : type (question / news / discussion), état (résolu / non résolu), tag, auteur, période (24 h / 7 j / 30 j / tout).
- Tri : pertinence (défaut), récent, votes.
- Recherche plein texte côté DB via `to_tsvector` sur `title + body`.

### Détails techniques
- **DB (une seule migration)** : ajout `profiles.onboarding_done boolean`, `profiles.interests text[]`, colonne générée `questions.search_tsv tsvector` + index GIN, RPC `search_questions(_q text, _type text, _resolved bool, _tag text, _author uuid, _since timestamptz, _sort text)`.
- **Edge functions** : `ai-improve-question` et `ai-suggest-tags` (Lovable AI Gateway, clé auto).
- **Composants nouveaux** : `OnboardingWizard.tsx`, `DraftIndicator.tsx` (+ hook `useDraft`), `AIAssistPanel.tsx`, `MarkdownSplitEditor.tsx`, `SearchFilters.tsx`, page `pages/Search.tsx`.
- **Fichiers modifiés** : `pages/AskQuestion.tsx`, `pages/QuestionDetail.tsx`, `components/Layout.tsx` (route `/search`), `App.tsx`, `pages/UserProfile.tsx` (interests), `admin/AdminRoadmap.tsx` (statuts `done`).
- Aucun secret utilisateur requis : la clé Lovable AI est provisionnée automatiquement dans les edge functions.

### Ordre d'exécution
1. Migration DB + edge functions IA.
2. Onboarding + interests.
3. Brouillons + split Markdown (frontend pur).
4. Assistant IA + suggestion de tags.
5. Recherche avancée.
6. Mise à jour de la roadmap admin.

Confirmez-vous que je peux tout implémenter d'un coup, ou préférez-vous que je commence par un sous-ensemble (par ex. onboarding + brouillons + split d'abord) ?

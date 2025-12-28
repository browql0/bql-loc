# ✅ GUIDE : Résoudre l'Erreur 406

## Problème
```
GET https://...supabase.co/rest/v1/profiles?select=role&id=eq.... 406 (Not Acceptable)
```

## Cause
Les politiques RLS (Row Level Security) empêchent l'utilisateur de lire son propre profil dans la table `profiles`.

## Solution : Exécuter le Script SQL

### Étape 1 : Ouvrir Supabase Dashboard
1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet

### Étape 2 : Accéder au SQL Editor
1. Dans le menu de gauche, cliquer sur **SQL Editor**
2. Cliquer sur **New Query**

### Étape 3 : Coller et Exécuter le Script
Copier et coller ce code dans l'éditeur :

```sql
-- Add RLS policy to allow users to read their own profile
-- This fixes the 406 error when checking role status

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Étape 4 : Exécuter
1. Cliquer sur **Run** ou appuyer sur `Ctrl+Enter`
2. Vérifier que le message de succès apparaît

### Étape 5 : Tester
1. Recharger votre application
2. Essayer de se connecter
3. L'erreur 406 devrait avoir disparu ✅

## Vérification

Après avoir exécuté le script, vous pouvez vérifier que la politique a été créée :

1. Dans Supabase Dashboard → **Authentication** → **Policies**
2. Chercher la table `profiles`
3. Vous devriez voir la politique "Users can read own profile"

## Alternative : Code Déjà Modifié

Le code `PendingApproval.jsx` a déjà été modifié pour gérer l'erreur :
- ✅ Il vérifie d'abord `user_metadata.role` (pas de requête DB)
- ✅ Si pas de rôle dans metadata, il essaie la DB
- ✅ Si erreur 406, il continue sans crash

**Mais pour éliminer complètement l'erreur de la console, vous DEVEZ exécuter le script SQL.**

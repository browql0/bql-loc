-- ═══════════════════════════════════════════════════════════════
-- 🔐 CRÉER / METTRE À JOUR SUPERADMIN
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: Donner le rôle superadmin à votre utilisateur
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- OPTION 1: Avec votre UID actuel (recommandé)
-- ─────────────────────────────────────────────────────────────

-- Insérer ou mettre à jour votre profil en tant que superadmin
INSERT INTO profiles (id, email, role, full_name, created_at)
VALUES (
    'eb4fc87b-bd54-4f68-ac3f-531c7a67c4fb',  -- Votre UID (vu dans les logs)
    'alihajjaj930@icloud.com',  -- Votre email
    'superadmin',
    'Ali Hajjaj',  -- Votre nom
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    email = 'alihajjaj930@icloud.com',
    role = 'superadmin',
    full_name = 'Ali Hajjaj';

-- Vérifier que ça a marché
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'eb4fc87b-bd54-4f68-ac3f-531c7a67c4fb';

-- ─────────────────────────────────────────────────────────────
-- OPTION 2: Si vous êtes connecté (utilise auth.uid())
-- ─────────────────────────────────────────────────────────────

-- Décommentez si vous préférez cette méthode:
/*
INSERT INTO profiles (id, role, full_name, created_at)
VALUES (
    auth.uid(),
    'superadmin',
    'Ali Hajjaj',
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'superadmin',
    full_name = 'Ali Hajjaj';
*/

-- ═══════════════════════════════════════════════════════════════
-- ✅ APRÈS EXÉCUTION
-- ═══════════════════════════════════════════════════════════════
-- 1. Retourner sur votre app (localhost:5173)
-- 2. Ctrl+Shift+R pour vider le cache
-- 3. Se reconnecter avec alihajjaj930@icloud.com
-- 4. Vous serez redirigé vers /superadmin/dashboard
-- ═══════════════════════════════════════════════════════════════

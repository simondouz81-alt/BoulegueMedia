-- Configuration additionnelle pour l'authentification Google dans Supabase

-- 1. Mettre à jour la fonction handle_new_user pour gérer Google Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- 2. Fonction pour vérifier l'unicité du nom d'utilisateur
CREATE OR REPLACE FUNCTION public.check_username_unique(new_username text, user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    -- Vérification pour nouveau utilisateur
    RETURN NOT EXISTS (SELECT 1 FROM profiles WHERE username = new_username);
  ELSE
    -- Vérification pour utilisateur existant (mise à jour)
    RETURN NOT EXISTS (SELECT 1 FROM profiles WHERE username = new_username AND id != user_id);
  END IF;
END;
$$ language plpgsql security definer;

-- 3. Ajouter des contraintes sur le nom d'utilisateur
ALTER TABLE profiles ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');

-- 4. Fonction pour générer un nom d'utilisateur unique
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_name text)
RETURNS text AS $$
DECLARE
  clean_name text;
  final_username text;
  counter int := 0;
BEGIN
  -- Nettoyer le nom de base
  clean_name := regexp_replace(lower(base_name), '[^a-z0-9_]', '', 'g');
  clean_name := substr(clean_name, 1, 25); -- Limiter à 25 caractères pour laisser place au compteur
  
  IF length(clean_name) < 3 THEN
    clean_name := 'user';
  END IF;
  
  final_username := clean_name;
  
  -- Vérifier l'unicité et ajouter un compteur si nécessaire
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := clean_name || '_' || counter::text;
  END LOOP;
  
  RETURN final_username;
END;
$$ language plpgsql security definer;

-- 5. Mettre à jour la fonction handle_new_user avec génération automatique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_username text;
BEGIN
  -- Générer un nom d'utilisateur unique
  generated_username := public.generate_unique_username(
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id, 
    generated_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- 6. Politique RLS mise à jour pour les profils
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 7. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(id); -- id correspond à l'auth.users.id

-- 8. Vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.created_at,
  COALESCE(article_count, 0) as article_count,
  COALESCE(post_count, 0) as post_count,
  COALESCE(comment_count, 0) as comment_count
FROM profiles p
LEFT JOIN (
  SELECT author_id, COUNT(*) as article_count 
  FROM articles 
  WHERE published = true 
  GROUP BY author_id
) a ON p.id = a.author_id
LEFT JOIN (
  SELECT author_id, COUNT(*) as post_count 
  FROM posts 
  GROUP BY author_id
) po ON p.id = po.author_id
LEFT JOIN (
  SELECT author_id, COUNT(*) as comment_count 
  FROM comments 
  GROUP BY author_id
) c ON p.id = c.author_id;

-- 9. Fonction pour mettre à jour le profil utilisateur
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id uuid,
  new_username text DEFAULT NULL,
  new_full_name text DEFAULT NULL,
  new_bio text DEFAULT NULL,
  new_avatar_url text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Vérifier que l'utilisateur peut modifier ce profil
  IF auth.uid() != user_id THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  -- Vérifier l'unicité du nom d'utilisateur si fourni
  IF new_username IS NOT NULL AND NOT public.check_username_unique(new_username, user_id) THEN
    RETURN json_build_object('error', 'Username already taken');
  END IF;
  
  -- Mettre à jour le profil
  UPDATE profiles 
  SET 
    username = COALESCE(new_username, username),
    full_name = COALESCE(new_full_name, full_name),
    bio = COALESCE(new_bio, bio),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Retourner le profil mis à jour
  SELECT json_build_object(
    'id', id,
    'username', username,
    'full_name', full_name,
    'bio', bio,
    'avatar_url', avatar_url,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM profiles
  WHERE id = user_id;
  
  RETURN result;
END;
$$ language plpgsql security definer;

COMMIT;
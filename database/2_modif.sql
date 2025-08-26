-- Correction finale avec syntaxe correcte pour les triggers
-- database/migrations/004_fix_author_id_correct_syntax.sql

-- 1. Supprimer les données défectueuses
DELETE FROM articles WHERE author_id IS NULL;

-- 2. Ajouter les colonnes manquantes pour les nouvelles fonctionnalités
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 3. Créer la table des commentaires d'articles
CREATE TABLE IF NOT EXISTS article_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Créer les index nécessaires
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_author ON article_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent ON article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(
  to_tsvector('french', title || ' ' || excerpt || ' ' || content)
);

-- 5. Fonction pour calculer le temps de lecture
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Approximation : 200 mots par minute
  RETURN GREATEST(1, CEIL(array_length(string_to_array(content_text, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour mettre à jour le compteur de commentaires d'articles
CREATE OR REPLACE FUNCTION update_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET comments_count = comments_count - 1 WHERE id = OLD.article_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 7. Fonction pour calculer automatiquement le temps de lecture
CREATE OR REPLACE FUNCTION auto_calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time = calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer les triggers (syntaxe correcte sans IF NOT EXISTS)
-- Supprimer d'abord s'ils existent
DROP TRIGGER IF EXISTS update_article_comments_updated_at ON article_comments;
DROP TRIGGER IF EXISTS update_article_comments_count_trigger ON article_comments;
DROP TRIGGER IF EXISTS auto_reading_time_trigger ON articles;

-- Créer les nouveaux triggers
CREATE TRIGGER update_article_comments_updated_at 
BEFORE UPDATE ON article_comments 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_article_comments_count_trigger 
AFTER INSERT OR DELETE ON article_comments 
FOR EACH ROW EXECUTE PROCEDURE update_article_comments_count();

CREATE TRIGGER auto_reading_time_trigger
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_reading_time();

-- 9. Politique RLS pour les commentaires d'articles
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques si elles existent déjà
DROP POLICY IF EXISTS "Article comments are viewable by everyone" ON article_comments;
DROP POLICY IF EXISTS "Authenticated users can insert article comments" ON article_comments;
DROP POLICY IF EXISTS "Users can update their own article comments" ON article_comments;
DROP POLICY IF EXISTS "Authors and admins can delete article comments" ON article_comments;

-- Créer les nouvelles politiques
CREATE POLICY "Article comments are viewable by everyone" 
ON article_comments FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Authenticated users can insert article comments" 
ON article_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own article comments" 
ON article_comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete article comments" 
ON article_comments FOR DELETE 
USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 10. Vue pour les articles avec informations d'auteur
CREATE OR REPLACE VIEW articles_with_author AS
SELECT 
  a.*,
  p.username as author_username,
  p.full_name as author_full_name,
  p.avatar_url as author_avatar_url
FROM articles a
JOIN profiles p ON a.author_id = p.id;

-- 11. Créer un utilisateur admin et des articles de test
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Vérifier s'il existe déjà un profil admin
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- Si aucun admin n'existe, en créer un
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        INSERT INTO profiles (id, username, full_name, role, created_at)
        VALUES (
            admin_user_id,
            'admin_boulegue',
            'Administrateur Boulegue',
            'admin',
            NOW()
        );
        
        RAISE NOTICE 'Utilisateur admin créé avec ID: %', admin_user_id;
    END IF;
    
    -- Insérer des articles de test
    INSERT INTO articles (
        title, 
        slug, 
        content, 
        excerpt, 
        author_id, 
        category, 
        tags, 
        published,
        featured,
        created_at
    ) VALUES 
    (
        'Bienvenue sur Boulegue Media',
        'bienvenue-sur-boulegue-media',
        'Boulegue Media est né d''une passion profonde pour la culture occitane et d''un désir de partager la richesse extraordinaire de notre patrimoine.

Notre région, l''Occitanie, regorge de trésors culturels, historiques et traditionnels qui méritent d''être célébrés et transmis aux générations futures.

**Notre mission**

Nous nous donnons pour mission de :
- Documenter et préserver la culture occitane
- Promouvoir les événements culturels de la région  
- Partager les histoires et légendes de notre territoire
- Créer une communauté passionnée autour de notre identité culturelle

**Ce que vous trouverez sur Boulegue**

Notre plateforme vous propose :
- Des articles approfondis sur l''histoire et la culture occitane
- Une carte interactive des événements culturels
- Des documentaires exclusifs sur notre patrimoine
- Un espace social pour échanger avec d''autres passionnés
- Une chronologie interactive de l''histoire occitane

Rejoignez-nous dans cette aventure culturelle !',
        'Découvrez Boulegue Media, votre nouveau compagnon pour explorer la richesse culturelle de l''Occitanie.',
        admin_user_id,
        'actualite',
        ARRAY['occitanie', 'culture', 'patrimoine', 'bienvenue'],
        true,
        true,
        NOW() - INTERVAL '2 days'
    ),
    (
        'Les Troubadours : Poètes de l''Amour Courtois',
        'les-troubadours-poetes-amour-courtois',
        'Au XIIe siècle, l''Occitanie voit naître un mouvement artistique et littéraire d''une richesse exceptionnelle : les troubadours.

**L''émergence des troubadours**

Le mouvement troubadouresque naît dans les cours seigneuriales d''Aquitaine et de Provence. Guillaume IX d''Aquitaine (1071-1126), grand-père d''Aliénor d''Aquitaine, est considéré comme le premier troubadour.

[QUOTE:Farai un vers de dreyt nien - Je ferai un vers de pure néant - Guillaume IX d''Aquitaine]

Ces artistes composent en langue d''oc, donnant ses lettres de noblesse à la littérature occitane.

**L''héritage des troubadours**

L''influence des troubadours dépasse largement les frontières de l''Occitanie. Ils inspirent les trouvères du nord de la France, les minnesänger allemands et même Dante Alighieri.',
        'Découvrez l''art des troubadours, ces poètes occitans qui ont révolutionné la littérature médiévale.',
        admin_user_id,
        'histoire',
        ARRAY['troubadours', 'moyen-age', 'poésie', 'amour-courtois'],
        true,
        true,
        NOW() - INTERVAL '5 days'
    ),
    (
        'Le Cassoulet : Une Guerre de Clochers Gastronomique',
        'cassoulet-guerre-clochers-gastronomique',
        'Peu de plats suscitent autant de passions que le cassoulet. Cette spécialité occitane divise les puristes entre Castelnaudary, Carcassonne et Toulouse.

**Les origines légendaires**

Plusieurs légendes entourent la naissance du cassoulet. La plus populaire le fait remonter au siège de Castelnaudary par les Anglais pendant la guerre de Cent Ans.

[QUOTE:Le cassoulet est le dieu de la cuisine occitane - Anatole France]

**La guerre des trois cassoulets**

Chaque ville revendique LA vraie recette :

**Castelnaudary : le père**
- Le plus pur, avec agneau et confit de canard
- Haricots lingots du Lauragais

**Carcassonne : le fils** 
- Ajoute la perdrix rouge en saison
- Tradition de la cassole en terre

**Toulouse : le Saint-Esprit**
- Enrichi de confit d''oie et saucisse de Toulouse
- Débats sur l''ajout de tomates',
        'Plongez dans la guerre gastronomique du cassoulet entre les trois villes occitanes !',
        admin_user_id,
        'culture',
        ARRAY['gastronomie', 'cassoulet', 'traditions'],
        true,
        false,
        NOW() - INTERVAL '1 week'
    ),
    (
        'Carcassonne : La Cité Médiévale',
        'carcassonne-cite-medievale',
        'Joyau de l''architecture médiévale, la Cité de Carcassonne dresse ses remparts depuis plus de 2500 ans.

**Une histoire millénaire**

L''occupation du site remonte au VIe siècle avant J.-C. avec l''oppidum gaulois, puis la ville romaine de Carcaso.

**Architecture défensive unique**

La Cité présente un système défensif remarquable :
- Double enceinte : 3 km de remparts
- 52 tours aux formes variées
- 4 portes fortifiées principales
- Château comtal du XIIe siècle

**Patrimoine mondial UNESCO**

Depuis 1997, la Cité de Carcassonne est inscrite au patrimoine mondial de l''UNESCO.',
        'Explorez la majestueuse Cité de Carcassonne, forteresse médiévale classée UNESCO.',
        admin_user_id,
        'patrimoine',
        ARRAY['carcassonne', 'médiéval', 'unesco', 'patrimoine'],
        true,
        false,
        NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (slug) DO NOTHING;

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Les articles de test existent déjà';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création: %', SQLERRM;
END $$;

-- 12. Mettre à jour les temps de lecture pour les articles existants
UPDATE articles 
SET reading_time = calculate_reading_time(content) 
WHERE reading_time = 0 OR reading_time IS NULL;

-- 13. Vue simple pour les statistiques
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.created_at,
  COALESCE(a.article_count, 0) as article_count,
  COALESCE(po.post_count, 0) as post_count,
  COALESCE(c.comment_count, 0) as comment_count
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
  FROM article_comments 
  GROUP BY author_id
) c ON p.id = c.author_id;

-- 14. Fonction pour s'assurer qu'il y a toujours un auteur valide
CREATE OR REPLACE FUNCTION ensure_valid_author()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.author_id) THEN
        RAISE EXCEPTION 'Author with ID % does not exist in profiles table', NEW.author_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Trigger pour vérifier l'auteur
DROP TRIGGER IF EXISTS check_valid_author ON articles;
CREATE TRIGGER check_valid_author
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_valid_author();

COMMIT;

-- Remplacer la fonction handle_new_user dans Supabase par celle-ci :

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
DECLARE
  username_value TEXT;
  full_name_value TEXT;
BEGIN
  -- Extraire les données des métadonnées
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user_' || extract(epoch from now())::text
  );
  
  full_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    'Utilisateur'
  );

  -- Insérer le profil avec gestion des conflits
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    username_value,
    full_name_value,
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log l'erreur mais ne pas faire échouer l'insertion de l'utilisateur
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
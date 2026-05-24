-- ─── Community v2 · Seed data ──────────────────────────────────
-- Run once in Supabase SQL Editor to populate demo content.
-- Uses your real profile IDs — safe to run on any environment.

DO $$
DECLARE
  -- grab up to 3 real profiles
  u1 UUID; u2 UUID; u3 UUID;

  -- post IDs we'll create
  p1 UUID := gen_random_uuid();
  p2 UUID := gen_random_uuid();
  p3 UUID := gen_random_uuid();
  p4 UUID := gen_random_uuid();
  p5 UUID := gen_random_uuid();
  p6 UUID := gen_random_uuid();
  p7 UUID := gen_random_uuid();
  p8 UUID := gen_random_uuid();
  p9 UUID := gen_random_uuid();
BEGIN

  -- ── Pick real user IDs ─────────────────────────────────────────
  SELECT id INTO u1 FROM profiles ORDER BY created_at ASC  LIMIT 1;
  SELECT id INTO u2 FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 1;
  SELECT id INTO u3 FROM profiles ORDER BY created_at DESC LIMIT 1;

  -- fall back to u1 if fewer than 3 users exist
  IF u2 IS NULL THEN u2 := u1; END IF;
  IF u3 IS NULL THEN u3 := u1; END IF;

  -- ── Tags ───────────────────────────────────────────────────────
  INSERT INTO tags (slug, display_name) VALUES
    ('тау',          'ТАУ — теорія автоматичного управління'),
    ('математика',   'Математичний аналіз та лінійна алгебра'),
    ('програмування','Алгоритми, структури даних, кодування'),
    ('фізика',       'Загальна та технічна фізика'),
    ('ресурси',      'Корисні посилання, підручники, відео'),
    ('питання',      'Запитання без відповіді'),
    ('допомога',     'Прошу про допомогу'),
    ('обговорення',  'Відкрите обговорення'),
    ('думки',        'Особисті думки та рефлексії'),
    ('корисне',      'Варте уваги')
  ON CONFLICT (slug) DO NOTHING;

  -- ── Posts ──────────────────────────────────────────────────────

  -- 1) Discussion — today
  INSERT INTO posts (id, user_id, kind, content, created_at)
  VALUES (p1, u1, 'discussion',
    'Всім привіт! Хто вже розібрався з передаточними функціями в ТАУ? Мені здається, що графічні методи (наприклад діаграми Боде) набагато інтуїтивніші ніж алгебраїчний розрахунок. Поділіться своїм досвідом 👇',
    now() - interval '2 hours');

  -- 2) Question — today, unsolved
  INSERT INTO posts (id, user_id, kind, title, content, created_at, is_solved)
  VALUES (p2, u2, 'question',
    'Як побудувати діаграму Боде для системи другого порядку?',
    'Маю передаточну функцію W(s) = 4 / (s² + 2s + 4). Намагаюсь побудувати діаграму Боде, але не розумію як правильно визначити кутову частоту зрізу і запас по фазі. Що я роблю не так?',
    now() - interval '5 hours', false);

  -- 3) Share — yesterday
  INSERT INTO posts (id, user_id, kind, content, url, url_title, created_at)
  VALUES (p3, u3, 'share',
    'Знайшла чудовий інтерактивний симулятор для ТАУ — можна в реальному часі змінювати параметри ПІД-регулятора і бачити відгук системи. Дуже допомагає зрозуміти як кожен коефіцієнт впливає на стійкість.',
    'https://ctms.engin.umich.edu/CTMS/index.php?example=Introduction&section=ControlPID',
    'Control Tutorials for MATLAB and Simulink — PID Control',
    now() - interval '1 day');

  -- 4) Question — yesterday, SOLVED
  INSERT INTO posts (id, user_id, kind, title, content, created_at, is_solved)
  VALUES (p4, u1, 'question',
    'Чи можна використовувати метод Ньютона для розв''язання нелінійних систем?',
    'Маю систему з 3 нелінійних рівнянь. Викладач казав що метод Ньютона збігається квадратично, але не пояснив як обрати початкове наближення щоб уникнути розбіжності.',
    now() - interval '1 day' - interval '3 hours', true);

  -- 5) Discussion — 3 days ago
  INSERT INTO posts (id, user_id, kind, content, created_at)
  VALUES (p5, u2, 'discussion',
    'Цікаво, що хтось ще використовує Julia для чисельних методів? Спробував після Python — різниця в швидкості відчутна. Особливо для великих матриць.',
    now() - interval '3 days');

  -- 6) Share — 4 days ago
  INSERT INTO posts (id, user_id, kind, content, url, url_title, created_at)
  VALUES (p6, u3, 'share',
    '3Blue1Brown зробив серію про лінійну алгебру — "Essence of linear algebra". Якщо ти досі не розумієш чому детермінант це площа/об''єм — обов''язково подивись. Змінило моє розуміння повністю.',
    'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
    'Essence of linear algebra — 3Blue1Brown',
    now() - interval '4 days');

  -- 7) Discussion — 5 days ago
  INSERT INTO posts (id, user_id, kind, content, created_at)
  VALUES (p7, u1, 'discussion',
    'Готуюся до заліку з фізики, повторюю електродинаміку. Хтось має гарні конспекти або задачники по темі "Рівняння Максвелла"? Університетський підручник занадто сухий 😅',
    now() - interval '5 days');

  -- 8) Question — 8 days ago, unsolved
  INSERT INTO posts (id, user_id, kind, title, content, created_at, is_solved)
  VALUES (p8, u2, 'question',
    'Різниця між stack і heap у C++?',
    'Розумію теоретично, але на практиці не завжди розумію коли що використовувати. Наприклад — якщо я створюю великий вектор у функції, чи краще повертати його по значенню чи передавати посилання?',
    now() - interval '8 days', false);

  -- 9) Share — 10 days ago
  INSERT INTO posts (id, user_id, kind, content, url, url_title, created_at)
  VALUES (p9, u3, 'share',
    'Для тих хто вчить алгоритми — Visualgo дозволяє покроково переглядати як працюють сортування, дерева, графи. Набагато краще ніж читати псевдокод.',
    'https://visualgo.net/en',
    'VisuAlgo — Visualising data structures and algorithms',
    now() - interval '10 days');

  -- ── Post tags ──────────────────────────────────────────────────
  INSERT INTO post_tags (post_id, tag_slug) VALUES
    (p1, 'тау'), (p1, 'обговорення'),
    (p2, 'тау'), (p2, 'питання'), (p2, 'допомога'),
    (p3, 'тау'), (p3, 'ресурси'), (p3, 'корисне'),
    (p4, 'математика'), (p4, 'питання'),
    (p5, 'програмування'), (p5, 'думки'),
    (p6, 'математика'), (p6, 'ресурси'), (p6, 'корисне'),
    (p7, 'фізика'), (p7, 'обговорення'),
    (p8, 'програмування'), (p8, 'питання'), (p8, 'допомога'),
    (p9, 'програмування'), (p9, 'ресурси')
  ON CONFLICT DO NOTHING;

  -- ── Reactions ─────────────────────────────────────────────────
  INSERT INTO reactions (user_id, post_id, type) VALUES
    (u2, p1, 'like'), (u3, p1, 'like'),
    (u1, p2, 'like'), (u3, p2, 'like'),
    (u1, p3, 'like'), (u2, p3, 'like'), (u3, p3, 'like'),
    (u2, p4, 'like'), (u3, p4, 'like'),
    (u1, p5, 'like'),
    (u1, p6, 'like'), (u2, p6, 'like'), (u3, p6, 'like'),
    (u2, p7, 'like'),
    (u3, p8, 'like'),
    (u1, p9, 'like'), (u2, p9, 'like')
  ON CONFLICT DO NOTHING;

  -- ── Comments ──────────────────────────────────────────────────
  -- on p1 (discussion about Bode)
  INSERT INTO comments (id, user_id, post_id, content, created_at)
  VALUES
    (gen_random_uuid(), u2, p1,
     'Погоджуюся! Діаграми Боде інтуїтивні для аналізу стійкості. Особливо корисно що можна одразу бачити запас по фазі і по амплітуді.',
     now() - interval '1 hour'),
    (gen_random_uuid(), u3, p1,
     'Я ще додав би метод кореневого годографа — він дає розуміння як полюси переміщуються при зміні коефіцієнта підсилення.',
     now() - interval '30 minutes');

  -- on p2 (question about Bode 2nd order)
  INSERT INTO comments (id, user_id, post_id, content, created_at)
  VALUES
    (gen_random_uuid(), u1, p2,
     'Для системи 2-го порядку ω₀ = √(k/m) = √4 = 2 рад/с. Запас по фазі = 180° + φ(ω_зр), де φ — аргумент W(jω) при частоті зрізу амплітуди.',
     now() - interval '4 hours'),
    (gen_random_uuid(), u3, p2,
     'Скористайся MATLAB: `margin(tf([4],[1 2 4]))` — він одразу намалює і покаже Gm та Pm.',
     now() - interval '2 hours');

  -- on p4 (solved question about Newton)
  INSERT INTO comments (id, user_id, post_id, content, created_at)
  VALUES
    (gen_random_uuid(), u3, p4,
     'Метод Ньютона дуже чутливий до початкового наближення. Хороша стратегія — спочатку запустити кілька ітерацій методу простої ітерації або бісекції щоб потрапити в область квадратичної збіжності.',
     now() - interval '22 hours');

  -- ── Saved posts ───────────────────────────────────────────────
  INSERT INTO saved_posts (user_id, post_id, saved_at) VALUES
    (u1, p3, now() - interval '20 hours'),
    (u1, p6, now() - interval '3 days'),
    (u2, p6, now() - interval '4 days'),
    (u2, p9, now() - interval '9 days'),
    (u3, p2, now() - interval '4 hours'),
    (u3, p4, now() - interval '1 day')
  ON CONFLICT DO NOTHING;

  -- ── Tag subscriptions ─────────────────────────────────────────
  INSERT INTO tag_subscriptions (user_id, tag_slug, followed_at) VALUES
    (u1, 'тау',          now() - interval '2 days'),
    (u1, 'математика',   now() - interval '1 day'),
    (u2, 'програмування',now() - interval '3 days'),
    (u2, 'тау',          now() - interval '1 day'),
    (u3, 'ресурси',      now() - interval '5 days'),
    (u3, 'фізика',       now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed complete. Posts: p1=% p2=% p3=% p4=% p5=% p6=% p7=% p8=% p9=%',
    p1, p2, p3, p4, p5, p6, p7, p8, p9;
END $$;

-- WuXue (武学) — Phase 1 seed: Stances (步型 Bùxíng)
-- Run this in the Supabase SQL editor AFTER 20260414_init.sql.
-- Idempotent: safe to re-run after content edits.

BEGIN;

-- ─── Module ───────────────────────────────────────────────────────────────
INSERT INTO modules (id, title_zh, title_pinyin, title_en, description, sort_order, category)
VALUES (
  'stances',
  '步型',
  'Bùxíng',
  'Stances',
  'The foundation of every wushu form. Learn to build power from the ground up.',
  0,
  'basics'
)
ON CONFLICT (id) DO UPDATE SET
  title_zh = EXCLUDED.title_zh,
  title_pinyin = EXCLUDED.title_pinyin,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  category = EXCLUDED.category;

-- ─── Lessons ──────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, title_zh, title_pinyin, title_en, description, sort_order, chinese_level)
VALUES
  ('mabu-gongbu', 'stances', '马步 & 弓步', 'Mǎbù & Gōngbù', 'Horse & Bow Stance',
   'The two stances you will use in every form. Build them right from the start.', 0, 0),
  ('pubu-xubu',   'stances', '仆步 & 虚步', 'Pūbù & Xūbù',   'Drop & Empty Stance',
   'Low and light — test your flexibility and balance with these transition stances.', 1, 1),
  ('xiebu',       'stances', '歇步',        'Xiēbù',         'Resting Stance',
   'The cross-legged squat that links jumps, sweeps, and changes of direction.', 2, 1)
ON CONFLICT (id) DO UPDATE SET
  module_id = EXCLUDED.module_id,
  title_zh = EXCLUDED.title_zh,
  title_pinyin = EXCLUDED.title_pinyin,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  chinese_level = EXCLUDED.chinese_level;

-- ─── Techniques ───────────────────────────────────────────────────────────

-- Lesson 1: mabu-gongbu
INSERT INTO techniques (id, lesson_id, chinese, pinyin, english, description, key_points, common_mistakes, sort_order)
VALUES (
  'mabu',
  'mabu-gongbu',
  '马步',
  'Mǎbù',
  'Horse Stance',
  'Feet parallel, wider than shoulder-width. Thighs parallel to ground. Back straight, weight centered.',
  '[
    "Feet parallel, toes forward",
    "Thighs parallel to ground",
    "Back straight, chest up, tailbone tucked",
    "Weight evenly distributed",
    "Knees track over toes, not caving inward"
  ]'::jsonb,
  '[
    "Leaning forward",
    "Knees caving inward",
    "Stance too narrow",
    "Butt sticking out"
  ]'::jsonb,
  0
),
(
  'gongbu',
  'mabu-gongbu',
  '弓步',
  'Gōngbù',
  'Bow Stance',
  'Front leg bent at ~90°, back leg straight. Like drawing a bow. Most common attacking stance in changquan.',
  '[
    "Front knee bent ~90° over ankle",
    "Back leg fully straight and locked",
    "Front foot forward, back foot ~45° out",
    "Hips squared forward",
    "Weight ~70% front / 30% back"
  ]'::jsonb,
  '[
    "Front knee past toes",
    "Back leg bending",
    "Hips not squared",
    "Stance too short"
  ]'::jsonb,
  1
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  chinese = EXCLUDED.chinese,
  pinyin = EXCLUDED.pinyin,
  english = EXCLUDED.english,
  description = EXCLUDED.description,
  key_points = EXCLUDED.key_points,
  common_mistakes = EXCLUDED.common_mistakes,
  sort_order = EXCLUDED.sort_order;

-- Lesson 2: pubu-xubu
INSERT INTO techniques (id, lesson_id, chinese, pinyin, english, description, key_points, common_mistakes, sort_order)
VALUES (
  'pubu',
  'pubu-xubu',
  '仆步',
  'Pūbù',
  'Drop / Crouching Stance',
  'One leg fully bent (sitting on it), other leg extended straight to the side. Tests flexibility and leg strength.',
  '[
    "Bent leg in full squat",
    "Extended leg fully straight, foot flat or hooked",
    "Torso upright",
    "Hips as low as possible",
    "Extended foot flat or toes hooked up"
  ]'::jsonb,
  '[
    "Extended leg bending",
    "Torso collapsing forward",
    "Not low enough",
    "Bent leg heel lifting"
  ]'::jsonb,
  0
),
(
  'xubu',
  'pubu-xubu',
  '虚步',
  'Xūbù',
  'Empty / Cat Stance',
  '~90% weight on back leg. Front foot barely touches ground. Used for quick front-leg kicks and transitions.',
  '[
    "~90% weight on back leg",
    "Back leg bent, sitting into it",
    "Front foot — only toes/ball touching",
    "Front knee slightly bent, relaxed",
    "Torso upright, slightly sitting back"
  ]'::jsonb,
  '[
    "Too much weight on front foot",
    "Standing too tall",
    "Front foot flat",
    "Leaning forward"
  ]'::jsonb,
  1
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  chinese = EXCLUDED.chinese,
  pinyin = EXCLUDED.pinyin,
  english = EXCLUDED.english,
  description = EXCLUDED.description,
  key_points = EXCLUDED.key_points,
  common_mistakes = EXCLUDED.common_mistakes,
  sort_order = EXCLUDED.sort_order;

-- Lesson 3: xiebu
INSERT INTO techniques (id, lesson_id, chinese, pinyin, english, description, key_points, common_mistakes, sort_order)
VALUES (
  'xiebu',
  'xiebu',
  '歇步',
  'Xiēbù',
  'Resting Stance / Cross-legged Squat',
  'Legs crossed, deep squat. Back leg crosses behind the front. Used in transitions and after jumps.',
  '[
    "Legs crossed, back behind front",
    "Sit deep, thighs close",
    "Back knee behind front calf",
    "Front foot flat, back foot on ball/toes",
    "Torso upright, chest proud"
  ]'::jsonb,
  '[
    "Not low enough",
    "Legs not properly crossed",
    "Leaning forward",
    "Back foot flat"
  ]'::jsonb,
  0
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  chinese = EXCLUDED.chinese,
  pinyin = EXCLUDED.pinyin,
  english = EXCLUDED.english,
  description = EXCLUDED.description,
  key_points = EXCLUDED.key_points,
  common_mistakes = EXCLUDED.common_mistakes,
  sort_order = EXCLUDED.sort_order;

-- ─── Quiz questions ───────────────────────────────────────────────────────
-- Identified by stable_key for idempotent re-seeding.

-- Lesson 1 quiz
INSERT INTO quiz_questions (lesson_id, question, options, correct_index, explanation, sort_order, stable_key)
VALUES
  ('mabu-gongbu',
   'What does 马步 (Mǎbù) mean?',
   '["Bow Stance","Horse Stance","Empty Stance","Drop Stance"]'::jsonb,
   1,
   '马 (mǎ) means horse — the stance mimics sitting low on horseback.',
   0,
   'q-mabu-gongbu-1'),
  ('mabu-gongbu',
   'In 弓步, what angle should the front knee be?',
   '["45°","120°","90°","180°"]'::jsonb,
   2,
   'Around 90° — a deeper angle collapses the structure, a shallower one wastes the stance.',
   1,
   'q-mabu-gongbu-2'),
  ('mabu-gongbu',
   'In 马步, how is weight distributed?',
   '["70/30","Even on both legs","All left","80/20 back"]'::jsonb,
   1,
   'Horse stance is symmetric — weight is centered evenly.',
   2,
   'q-mabu-gongbu-3'),
  ('mabu-gongbu',
   'What does 弓 (gōng) literally mean?',
   '["Horse","Bow (archery)","Sword","Fist"]'::jsonb,
   1,
   '弓 is the archery bow — the stance shape mirrors a drawn bow.',
   3,
   'q-mabu-gongbu-4')
ON CONFLICT (stable_key) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

-- Lesson 2 quiz
INSERT INTO quiz_questions (lesson_id, question, options, correct_index, explanation, sort_order, stable_key)
VALUES
  ('pubu-xubu',
   'What does 虚 (xū) mean?',
   '["Strong","Empty / Void","Fast","Low"]'::jsonb,
   1,
   '虚 means empty — the front leg carries almost no weight.',
   0,
   'q-pubu-xubu-1'),
  ('pubu-xubu',
   'In 仆步, how should the extended leg be?',
   '["Slightly bent","Fully straight","Crossed behind","Lifted"]'::jsonb,
   1,
   'The extended leg must lock out completely — a bent extended leg collapses the stance.',
   1,
   'q-pubu-xubu-2'),
  ('pubu-xubu',
   'Weight on back leg in 虚步?',
   '["50%","70%","~90%","100%"]'::jsonb,
   2,
   'About 90% on the back leg; the front foot barely touches.',
   2,
   'q-pubu-xubu-3'),
  ('pubu-xubu',
   'What does 仆步 translate to?',
   '["Empty Stance","Resting Stance","Drop / Crouching Stance","Twisted Stance"]'::jsonb,
   2,
   '仆 (pū) evokes dropping or falling to the ground — hence the deep drop stance.',
   3,
   'q-pubu-xubu-4')
ON CONFLICT (stable_key) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

-- Lesson 3 quiz
INSERT INTO quiz_questions (lesson_id, question, options, correct_index, explanation, sort_order, stable_key)
VALUES
  ('xiebu',
   'What does 歇 (xiē) mean?',
   '["Cross","Rest","Twist","Jump"]'::jsonb,
   1,
   '歇 means to rest — despite looking like a cross, the name means resting.',
   0,
   'q-xiebu-1'),
  ('xiebu',
   'Where should the back knee be in 歇步?',
   '["In front","Behind the front calf","Beside","Lifted"]'::jsonb,
   1,
   'The back leg crosses behind and the back knee tucks behind the front calf.',
   1,
   'q-xiebu-2'),
  ('xiebu',
   'Name all five basic stances:',
   '["马步 弓步 仆步 虚步 歇步","马步 弓步 丁步 虚步 歇步","马步 弓步 仆步 虚步 坐步","马步 弓步 仆步 独立步 歇步"]'::jsonb,
   0,
   'The five fundamental stances of changquan: 马步, 弓步, 仆步, 虚步, 歇步.',
   2,
   'q-xiebu-3'),
  ('xiebu',
   'Which stance is a deep cross-legged squat?',
   '["马步","仆步","歇步","虚步"]'::jsonb,
   2,
   '歇步 is the cross-legged resting squat.',
   3,
   'q-xiebu-4')
ON CONFLICT (stable_key) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

COMMIT;

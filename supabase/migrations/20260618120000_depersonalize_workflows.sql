-- Depersonalize existing workflows: remove hardcoded owner/repo references
-- Replaces "jfcyberknight/darkmedia-x_github_ai" and "darkmedia-x_github_ai"
-- with generic terms so workflows are reusable across any repo.

update public.workflows
set
  title = replace(title, '— darkmedia-x_github_ai', '— JavaScript'),
  description = replace(
    replace(description, 'pour jfcyberknight/darkmedia-x_github_ai.', 'pour ce dépôt.'),
    'pour jfcyberknight/darkmedia-x_github_ai', 'pour ce dépôt'
  ),
  content = replace(
    replace(
      replace(content,
        'le dépôt jfcyberknight/darkmedia-x_github_ai', 'ce dépôt'),
      'sur jfcyberknight/darkmedia-x_github_ai', 'sur ce projet'),
    'jfcyberknight/darkmedia-x_github_ai', 'ce dépôt'
  ),
  updated_at = now()
where title like '%darkmedia-x_github_ai%'
   or description like '%jfcyberknight/darkmedia-x_github_ai%'
   or content like '%jfcyberknight/darkmedia-x_github_ai%';

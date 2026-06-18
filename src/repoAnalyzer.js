export const CATEGORIES = ['Analyse', 'Automatisation', 'Code', 'Créatif', 'Débogage', 'Documentation', 'Formation', 'Général']

const DETECTORS = [
  { key: 'package.json', label: 'Node.js / JS / TS', priority: 1 },
  { key: 'pyproject.toml', label: 'Python', priority: 1 },
  { key: 'requirements.txt', label: 'Python', priority: 2 },
  { key: 'go.mod', label: 'Go', priority: 1 },
  { key: 'Cargo.toml', label: 'Rust', priority: 1 },
  { key: 'composer.json', label: 'PHP', priority: 1 },
  { key: 'Gemfile', label: 'Ruby', priority: 1 },
  { key: 'pom.xml', label: 'Java / Maven', priority: 1 },
  { key: 'build.gradle', label: 'Java / Gradle', priority: 1 },
  { key: 'Dockerfile', label: 'Docker', priority: 1 },
  { key: '.github/workflows', label: 'GitHub Actions / CI', priority: 1 },
  { key: 'docker-compose.yml', label: 'Docker Compose', priority: 2 },
  { key: 'docker-compose.yaml', label: 'Docker Compose', priority: 2 },
  { key: 'Makefile', label: 'Make', priority: 3 },
  { key: 'lerna.json', label: 'Lerna / Monorepo', priority: 2 },
  { key: 'tsconfig.json', label: 'TypeScript', priority: 2 },
  { key: 'vite.config.js', label: 'Vite', priority: 2 },
  { key: 'vite.config.ts', label: 'Vite', priority: 2 },
  { key: 'next.config.js', label: 'Next.js', priority: 2 },
  { key: 'nuxt.config.js', label: 'Nuxt', priority: 2 },
  { key: '.gitlab-ci.yml', label: 'GitLab CI', priority: 2 },
  { key: 'CMakeLists.txt', label: 'CMake', priority: 2 },
  { key: 'pubspec.yaml', label: 'Flutter / Dart', priority: 2 },
  { key: 'mix.exs', label: 'Elixir', priority: 2 },
  { key: 'Podfile', label: 'CocoaPods / iOS', priority: 2 },
  { key: 'Cargo.toml', label: 'Rust', priority: 1 },
  { key: 'composer.json', label: 'PHP', priority: 1 },
  { key: 'Gemfile', label: 'Ruby', priority: 1 },
]

export async function analyzeRepo(url) {
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/)
  if (!match) throw new Error("L'URL doit être un dépôt GitHub valide (ex: https://github.com/owner/repo)")

  const [, owner, repoName] = match
  const repo = repoName.replace(/\.git$/, '')
  const apiRoot = `https://api.github.com/repos/${owner}/${repo}`
  const headers = { Accept: 'application/vnd.github.v3+json' }

  const [repoRes, contentsRes] = await Promise.all([
    fetch(apiRoot, { headers }),
    fetch(`${apiRoot}/contents`, { headers }),
  ])

  if (!repoRes.ok) throw new Error(`Dépôt introuvable : ${owner}/${repo}`)

  const repoData = await repoRes.json()
  const files = contentsRes.ok ? await contentsRes.json() : []

  const fileNames = (Array.isArray(files) ? files : []).map(f => f.name)
  const detected = DETECTORS.filter(d => fileNames.includes(d.key))
    .sort((a, b) => a.priority - b.priority)

  const stacks = [...new Set(detected.map(d => d.label))]
  const lang = repoData.language || stacks[0] || 'Général'

  const workflows = generateWorkflows(owner, repo, repoData.description || '', stacks.length ? stacks.join(', ') : lang)

  return {
    owner,
    repo,
    description: repoData.description || '',
    language: lang,
    stacks,
    stars: repoData.stargazers_count || 0,
    topics: repoData.topics || [],
    defaultBranch: repoData.default_branch || 'main',
    htmlUrl: repoData.html_url,
    workflows,
  }
}

function generateWorkflows(owner, repo, description, tech) {
  const lang = tech || 'Général'
  const ref = `${owner}/${repo}`

  return [
    {
      title: `Revue de code — ${repo}`,
      description: `Analyse de code ciblée ${lang} avec checklists qualité, sécurité et performance pour ${ref}.`,
      content: `Tu es un ingénieur senior spécialiste ${lang}. Analyse le dépôt ${ref} et produis une revue structurée :

1. **Architecture** — Découpage, couplage, cohérence du modèle de données.
2. **Sécurité** — Failles potentielles (OWASP Top 10), secrets, validations.
3. **Performance** — Requêtes N+1, bottlenecks, mise en cache absente.
4. **Qualité** — Tests manquants, dette technique, patterns incohérents.
5. **Maintenabilité** — Complexité cyclomatique, duplication, documentation.

Format : checklist actionnable priorisée par sévérité (🔴 🟡 🟢).`,
      category: 'Code',
      tags: ['revue-de-code', 'qualité', lang.toLowerCase().replace(/\s+/g, '-')],
    },
    {
      title: `Debug & Dépannage — ${repo}`,
      description: `Workflow de diagnostic structuré pour bugs et incidents sur stack ${lang}.`,
      content: `Tu es un SRE spécialiste ${lang}. Un incident est signalé sur ${ref}. Suis ce protocole :

1. **Reproduction** — Déterminer le scope exact, environnement, logs.
2. **Isolation** — Git bisect, binaire des dépendances, variables d'env.
3. **Diagnostic** — Stack traces, métriques, profiling, assertions.
4. **Correctif** — Patch minimal, test de régression, rollback plan.
5. **Post-mortem** — Root cause, blameless, action items.

Format : chaque étape avec commandes concrètes et exemples de sortie attendue.`,
      category: 'Débogage',
      tags: ['debug', 'sre', lang.toLowerCase().replace(/\s+/g, '-')],
    },
    {
      title: `Documentation — ${repo}`,
      description: `Génération de documentation technique et README enrichi pour ${ref}.`,
      content: `Tu es un technical writer. Documente le dépôt ${ref} (${lang}) :

1. **README** — Badges, démarrage rapide, prérequis, variables d'env.
2. **Architecture** — Diagramme textuel, flux de données, décisions clés (ADR).
3. **API / Modules** — Signatures, exemples, contrats, gestion d'erreurs.
4. **Contribution** — Setup dev, tests, conventions, review process.

Format : Markdown prêt à copier, structuré par section.`,
      category: 'Documentation',
      tags: ['documentation', 'readme', lang.toLowerCase().replace(/\s+/g, '-')],
    },
    {
      title: `Tests & Qualité — ${repo}`,
      description: `Stratégie de test et génération de cas de test pour stack ${lang}.`,
      content: `Tu es un QA engineer expert ${lang}. Analyse ${ref} et produis :

1. **Stratégie** — Unitaires, intégration, E2E — couverture cible par module.
2. **Cas de test prioritaires** — Edge cases, valeurs limites, scénarios erreur.
3. **Mocks / Fixtures** — Données de test, services externes à simuler.
4. **Pipeline CI** — Étapes de validation, gate de qualité, rapports.

Format : Gherkin (Feature/Scenario) + extraits de code du framework adapté.`,
      category: 'Code',
      tags: ['tests', 'qa', lang.toLowerCase().replace(/\s+/g, '-')],
    },
    {
      title: `Architecture & Dette Technique — ${repo}`,
      description: `Analyse d'architecture, diagramme C4 et plan de refactoring pour ${ref}.`,
      content: `Tu es un architecte logiciel. Analyse ${ref} et livre :

1. **Vue C4** — Contexte, conteneurs, composants, code (textuel).
2. **Forces & Faiblesses** — Ce qui est bien conçu / à améliorer.
3. **Dette technique** — Hotspots, deprecated, non testé, duplication.
4. **Feuille de route** — Refactoring par priorité (quick wins vs chantiers).

Format : sections concises avec extraits de code pour illustrer chaque point.`,
      category: 'Analyse',
      tags: ['architecture', 'dette-technique', lang.toLowerCase().replace(/\s+/g, '-')],
    },
  ]
}

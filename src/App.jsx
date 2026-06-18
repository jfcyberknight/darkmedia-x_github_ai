import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Bot, Check, ChevronDown, Clock3, Copy, GitFork, Grid3X3, Info, LogOut,
  Menu, Plus, Search, Settings, Sparkles, Star, Tags, Trash2, Wand2, X,
} from 'lucide-react'
import { analyzeRepo } from './repoAnalyzer.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(url && key && !url.includes('your-project') && key !== 'your-anon-key')
const supabase = configured ? createClient(url, key) : null

const CATEGORIES = ['Analyse', 'Automatisation', 'Code', 'Créatif', 'Débogage', 'Documentation', 'Formation', 'Général']
const COLORS = { Analyse: '#f59e0b', Automatisation: '#8b5cf6', Code: '#10b981', Créatif: '#ec4899', Débogage: '#ef4444', Documentation: '#0ea5e9', Formation: '#14b8a6', Général: '#6366f1' }
const blankForm = { title: '', description: '', content: '', category: 'Général', model: '', tagsText: '', favorite: false }

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!configured)
  const [workflows, setWorkflows] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Tous les workflows')
  const [sort, setSort] = useState('recent')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importState, setImportState] = useState('idle')
  const [importResult, setImportResult] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [notice, setNotice] = useState(null)
  const searchRef = useRef(null)

  const notify = useCallback((text, type = 'success') => {
    setNotice({ text, type, id: Date.now() })
  }, [])

  const loadWorkflows = useCallback(() => {
    setDataLoading(true)
    supabase.from('workflows').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      setDataLoading(false)
      if (error) notify(`Chargement impossible : ${error.message}`, 'error')
      else setWorkflows(data || [])
    })
  }, [notify])

  useEffect(() => {
    if (!supabase) return undefined
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) notify(error.message, 'error')
      setSession(data?.session || null)
      if (data?.session) setDataLoading(true)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setAuthReady(true)
      if (!next) setWorkflows([])
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [notify])

  useEffect(() => {
    if (authReady && session) loadWorkflows()
  }, [authReady, session, loadWorkflows])

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setModalOpen(false)
        setImportOpen(false)
        setSettingsOpen(false)
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  async function handleLogin(event) {
    event.preventDefault()
    if (!supabase) return notify('Configure VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.', 'info')
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
    if (error) notify(error.message, 'error')
    else notify('Connexion réussie.')
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) notify(error.message, 'error')
    else notify('Déconnecté.')
  }

  const stats = useMemo(() => ({
    total: workflows.length,
    favs: workflows.filter(workflow => workflow.favorite).length,
    cats: CATEGORIES.map(name => ({ name, count: workflows.filter(workflow => workflow.category === name).length })),
    tags: [...new Set(workflows.flatMap(workflow => workflow.tags || []))].slice(0, 14),
  }), [workflows])

  const filtered = useMemo(() => workflows.filter(workflow => {
    const needle = query.trim().toLocaleLowerCase('fr')
    const haystack = [workflow.title, workflow.description, workflow.content, workflow.model, ...(workflow.tags || [])].join(' ').toLocaleLowerCase('fr')
    const matchesQuery = !needle || haystack.includes(needle)
    const matchesFilter = filter === 'Tous les workflows' || (filter === 'Favoris' ? workflow.favorite : workflow.category === filter || (workflow.tags || []).includes(filter))
    return matchesQuery && matchesFilter
  }).sort((a, b) => sort === 'popular'
    ? (b.usage_count || 0) - (a.usage_count || 0)
    : new Date(b.created_at) - new Date(a.created_at)), [workflows, query, filter, sort])

  function selectFilter(value) {
    setFilter(value)
    setMobileNavOpen(false)
  }

  function openModal(workflow = null) {
    setEditing(workflow)
    setForm(workflow ? { ...workflow, tagsText: (workflow.tags || []).join(', ') } : { ...blankForm })
    setModalOpen(true)
  }

  async function saveWorkflow(event) {
    event.preventDefault()
    if (!session) return
    const payload = {
      title: form.title.trim(), description: form.description.trim(), content: form.content.trim(),
      category: form.category, model: form.model.trim(), favorite: Boolean(form.favorite),
      tags: [...new Set(form.tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))],
      user_id: session.user.id,
    }
    const queryBuilder = editing
      ? supabase.from('workflows').update(payload).eq('id', editing.id)
      : supabase.from('workflows').insert(payload)
    const { data, error } = await queryBuilder.select().single()
    if (error) return notify(error.message, 'error')
    setWorkflows(previous => editing ? previous.map(item => item.id === editing.id ? data : item) : [data, ...previous])
    setModalOpen(false)
    notify(editing ? 'Workflow mis à jour.' : 'Workflow créé.')
  }

  async function removeWorkflow(workflow) {
    if (!window.confirm(`Supprimer « ${workflow.title} » ?`)) return
    if (!session) return
    const { error } = await supabase.from('workflows').delete().eq('id', workflow.id)
    if (error) return notify(error.message, 'error')
    setWorkflows(previous => previous.filter(item => item.id !== workflow.id))
    notify('Workflow supprimé.', 'info')
  }

  async function patchWorkflow(workflow, changes) {
    if (!session) return
    const updated = { ...workflow, ...changes }
    const { error } = await supabase.from('workflows').update(changes).eq('id', workflow.id)
    if (error) return notify(error.message, 'error')
    setWorkflows(previous => previous.map(item => item.id === workflow.id ? updated : item))
  }

  async function copyWorkflow(workflow) {
    try {
      await navigator.clipboard.writeText(workflow.content)
      await patchWorkflow(workflow, { usage_count: (workflow.usage_count || 0) + 1 })
      notify('Workflow copié dans le presse-papiers.')
    } catch {
      notify('Le presse-papiers est inaccessible.', 'error')
    }
  }

  if (!authReady) {
    return <div className="auth-screen"><Sparkles className="spin" /> Initialisation…</div>
  }

  if (!configured) {
    return <div className="auth-screen">
      <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>
        <Bot size={32} style={{ color: '#0ea5e9', marginBottom: 8 }} />
        <h2>DarkMedia · Workflow AI</h2>
        <p style={{ color: '#9da1bd', margin: '12px 0' }}>
          Ajoute <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>
          {' '}dans le fichier <code>.env</code> pour démarrer.
        </p>
        <p style={{ color: '#686b83', fontSize: 13 }}>
          Copie <code>.env.example</code> vers <code>.env</code> et renseigne les valeurs de ton projet Supabase.
        </p>
      </div>
    </div>
  }

  if (!session) {
    return <div className="auth-screen">
      <form className="auth-card" onSubmit={handleLogin} style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Bot size={32} style={{ color: '#0ea5e9' }} />
          <h2 style={{ margin: '8px 0 4px' }}>DarkMedia · Workflow AI</h2>
          <p style={{ color: '#9da1bd', margin: 0, fontSize: 13 }}>Connecte-toi pour accéder à ta bibliothèque</p>
        </div>
        <label style={{ color: '#a5a8c1', fontWeight: 700, fontSize: 13 }}>
          Courriel
          <input type="email" autoComplete="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} placeholder="email@domain.com" required />
        </label>
        <label style={{ color: '#a5a8c1', fontWeight: 700, fontSize: 13 }}>
          Mot de passe
          <input type="password" autoComplete="current-password" minLength="6" value={authPassword} onChange={event => setAuthPassword(event.target.value)} placeholder="Mot de passe" required />
        </label>
        <button className="primary" style={{ width: '100%', justifyContent: 'center' }}>Se connecter</button>
      </form>
    </div>
  }

  return <div className="app">
    <Sidebar open={mobileNavOpen} stats={stats} filter={filter} onFilter={selectFilter} />
    {mobileNavOpen && <button className="nav-backdrop" aria-label="Fermer la navigation" onClick={() => setMobileNavOpen(false)} />}
    <main>
      <header className="topbar">
        <button className="icon mobile-menu" aria-label="Ouvrir la navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
        <div className="header-actions">
          <span className="mode-pill cloud">{session.user.email}</span>
          <button className="icon" aria-label="Paramètres" onClick={() => setSettingsOpen(true)}><Settings size={18}/></button>
          <button className="icon" aria-label="Se déconnecter" onClick={signOut}><LogOut size={18}/></button>
          <button className="icon" aria-label="Importer depuis GitHub" title="Importer depuis GitHub" onClick={() => { setImportOpen(true); setImportState('idle'); setImportResult(null) }}><GitFork size={18}/></button>
          <button className="primary" onClick={() => openModal()}><Plus size={18}/> Nouveau workflow</button>
        </div>
      </header>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">Bibliothèque privée</p><h1>Crée, organise et réutilise tes workflows IA.</h1><p>Recherche, catégories, favoris et sauvegarde privée — synchronisée avec Supabase.</p></div>
        <div className="auth-card connected">
          <div className="status-icon"><Check/></div>
          <div>
            <h3 style={{ margin: 0 }}>Synchronisation active</h3>
            <p>{session.user.email}</p>
            <small style={{ color: '#81859f' }}>Données protégées par Row Level Security.</small>
          </div>
        </div>
      </section>
      <div className="toolbar">
        <label><Search size={17}/><span className="sr-only">Rechercher</span><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher… (Ctrl+K)" /></label>
        <select aria-label="Trier les workflows" value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Plus récents</option><option value="popular">Plus utilisés</option></select>
      </div>
      <div className="results-heading"><p><b>{filtered.length}</b> workflow{filtered.length > 1 ? 's' : ''}{filter !== 'Tous les workflows' && <> dans <span>{filter}</span></>}</p>{(query || filter !== 'Tous les workflows') && <button className="link" onClick={() => { setQuery(''); setFilter('Tous les workflows') }}>Réinitialiser</button>}</div>
      {dataLoading ? <div className="empty"><Sparkles className="spin" /><h2>Chargement de tes workflows…</h2></div> : filtered.length ? <section className="grid">{filtered.map(workflow => <WorkflowCard key={workflow.id} workflow={workflow} onEdit={() => openModal(workflow)} onDelete={() => removeWorkflow(workflow)} onFavorite={() => patchWorkflow(workflow, { favorite: !workflow.favorite })} onCopy={() => copyWorkflow(workflow)} />)}</section> : <EmptyState onReset={() => { setQuery(''); setFilter('Tous les workflows') }} onCreate={() => openModal()} />}
    </main>
    {modalOpen && <WorkflowModal form={form} setForm={setForm} onClose={() => setModalOpen(false)} onSubmit={saveWorkflow} editing={editing} />}
    {importOpen && <ImportModal session={session} state={importState} setState={setImportState} result={importResult} setResult={setImportResult} onClose={() => setImportOpen(false)} onImport={async (s, r) => { const d = await importWorkflows(s, r); setWorkflows(prev => [...d, ...prev]); return d }} notify={notify} />}
    {settingsOpen && <SettingsModal session={session} count={workflows.length} onClose={() => setSettingsOpen(false)} />}
    {notice && <div className={`toast ${notice.type}`} role="status">{notice.type === 'error' ? <X size={17}/> : notice.type === 'info' ? <Info size={17}/> : <Check size={17}/>}<span>{notice.text}</span><button aria-label="Fermer" onClick={() => setNotice(null)}><X size={15}/></button></div>}
  </div>
}

async function importWorkflows(session, repoInfo) {
  const records = repoInfo.workflows.map(w => ({
    title: w.title, description: w.description, content: w.content,
    category: w.category, model: '', favorite: false,
    tags: w.tags, user_id: session.user.id,
  }))
  const { data, error } = await supabase.from('workflows').insert(records).select()
  if (error) throw error
  return data
}

function Sidebar({ open, stats, filter, onFilter }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="brand"><Bot size={22} /><strong>DarkMedia · Workflow AI</strong></div>
    <small>VUE</small>
    <NavItem active={filter === 'Tous les workflows'} icon={<Grid3X3 />} label="Tous les workflows" count={stats.total} onClick={() => onFilter('Tous les workflows')} />
    <NavItem active={filter === 'Favoris'} icon={<Star />} label="Favoris" count={stats.favs} onClick={() => onFilter('Favoris')} />
    <small>CATÉGORIES</small>{stats.cats.map(category => <NavItem key={category.name} dot={COLORS[category.name]} active={filter === category.name} label={category.name} count={category.count} onClick={() => onFilter(category.name)} />)}
    {stats.tags.length > 0 && <><small>TAGS POPULAIRES</small>{stats.tags.map(tag => <button className={`tag-nav ${filter === tag ? 'active' : ''}`} key={tag} onClick={() => onFilter(tag)}><Tags size={14}/>{tag}</button>)}</>}
  </aside>
}

function NavItem({ icon, label, count, active, onClick, dot }) {
  return <button className={`nav ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}>{dot && <i style={{ background: dot }}/>} {icon && <span className="nav-icon">{icon}</span>}<span>{label}</span><b>{count}</b></button>
}

function WorkflowCard({ workflow, onEdit, onDelete, onFavorite, onCopy }) {
  return <article className="card">
    <button className="star" aria-label={workflow.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={onFavorite}><Star size={18} fill={workflow.favorite ? '#f59e0b' : 'none'}/></button>
    <h3>{workflow.title}</h3><p>{workflow.description || 'Aucune description.'}</p><pre>{workflow.content}</pre>
    <div className="chips"><span style={{ borderColor: COLORS[workflow.category], color: COLORS[workflow.category] }}>{workflow.category}</span>{workflow.model && <span>{workflow.model}</span>}{(workflow.tags || []).slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div>
    <footer><small><Clock3 size={13}/>{new Date(workflow.created_at).toLocaleDateString('fr-CA')} · {workflow.usage_count || 0} util.</small><div><button aria-label="Copier le workflow" title="Copier" onClick={onCopy}><Copy size={15}/></button><button aria-label="Modifier le workflow" title="Modifier" onClick={onEdit}><Wand2 size={15}/></button><button className="danger-button" aria-label="Supprimer le workflow" title="Supprimer" onClick={onDelete}><Trash2 size={15}/></button></div></footer>
  </article>
}

function WorkflowModal({ form, setForm, onClose, onSubmit, editing }) {
  const [notes, setNotes] = useState('')
  const [direction, setDirection] = useState('')
  function structureNotes() {
    const clean = notes.trim()
    if (!clean) return
    const firstLine = clean.split(/\r?\n/).find(Boolean) || ''
    setForm(previous => ({ ...previous, title: previous.title || firstLine.slice(0, 80), description: previous.description || `Workflow structuré à partir de notes : ${firstLine}`.slice(0, 150), content: `Objectif\n${clean}\n\nÉtapes\n1. Analyse le contexte et les contraintes.\n2. Exécute la tâche méthodiquement.\n3. Vérifie le résultat avant livraison.\n\nFormat de sortie\nRetourne une réponse structurée, concise et directement exploitable.` }))
  }
  function improve() {
    if (!direction.trim()) return
    setForm(previous => ({ ...previous, content: `${previous.content.trim()}\n\nConsigne d’amélioration\n${direction.trim()}\n\nCritères de validation\n- Réponse exacte et actionnable\n- Hypothèses explicitement signalées\n- Résultat relu avant livraison` }))
  }
  return <div className="overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="workflow-modal-title" onSubmit={onSubmit}>
    <header><h2 id="workflow-modal-title">{editing ? 'Modifier le workflow' : 'Nouveau workflow'}</h2><button type="button" aria-label="Fermer" onClick={onClose}><X/></button></header>
    <details><summary><Sparkles size={16}/> Structurer à partir de notes <ChevronDown size={16}/></summary><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Colle ici l’objectif, le contexte ou des notes brutes."/><button type="button" className="secondary" disabled={!notes.trim()} onClick={structureNotes}>Structurer le workflow</button></details>
    <details><summary><Wand2 size={16}/> Ajouter une orientation <ChevronDown size={16}/></summary><input value={direction} onChange={event => setDirection(event.target.value)} placeholder="Ex. : rends-le plus orienté sécurité et DDD"/><button type="button" className="secondary" disabled={!direction.trim() || !form.content.trim()} onClick={improve}>Ajouter au workflow</button></details>
    <label>Titre *<input autoFocus value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ex. : Automatiser une revue de code" required maxLength="120"/></label>
    <label>Description courte<input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="À quoi sert ce workflow ?" maxLength="240"/></label>
    <label>Contenu du workflow *<textarea value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} placeholder="Colle ou écris ton workflow ici…" required/></label>
    <div className="two"><label>Catégorie<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label><label>Modèle IA<input value={form.model || ''} onChange={event => setForm({ ...form, model: event.target.value })} placeholder="Ex. : Claude, GPT, Gemini…"/></label></div>
    <label>Tags<input value={form.tagsText} onChange={event => setForm({ ...form, tagsText: event.target.value })} placeholder="agent, architecture, sécurité"/></label>
    <label className="favorite-check"><input type="checkbox" checked={Boolean(form.favorite)} onChange={event => setForm({ ...form, favorite: event.target.checked })}/> Ajouter aux favoris</label>
    <footer><button type="button" className="secondary" onClick={onClose}>Annuler</button><button className="primary"><Check size={17}/> Sauvegarder</button></footer>
  </form></div>
}

function SettingsModal({ session, count, onClose }) {
  return <div className="overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><h2 id="settings-title">État de l’application</h2><button aria-label="Fermer" onClick={onClose}><X/></button></header><div className="settings-content"><div className="setting-row"><span>Stockage</span><b>Supabase Cloud</b></div><div className="setting-row"><span>Session</span><b>{session ? session.user.email : 'Hors connexion'}</b></div><div className="setting-row"><span>Workflows</span><b>{count}</b></div></div></section></div>
}

function ImportModal({ session, state, setState, result, setResult, onClose, onImport, notify }) {
  const [url, setUrl] = useState('')
  async function handleAnalyze(event) {
    event.preventDefault()
    if (!url.trim()) return
    setState('loading')
    try {
      const data = await analyzeRepo(url.trim())
      setResult(data)
      setState('done')
    } catch (err) {
      notify(err.message, 'error')
      setState('idle')
    }
  }
  async function handleImportAll() {
    if (!result) return
    setState('saving')
    try {
      const saved = await onImport(session, result)
      notify(`${saved.length} workflows importés depuis ${result.owner}/${result.repo}`)
      setState('idle')
      onClose()
    } catch (err) {
      notify(err.message, 'error')
      setState('done')
    }
  }
  return <div className="overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header><h2 id="import-title">Importer depuis GitHub</h2><button aria-label="Fermer" onClick={onClose}><X/></button></header>
      <div className="settings-content">
        {state === 'idle' && <form onSubmit={handleAnalyze}>
          <label style={{ display: 'block', marginBottom: 16, fontWeight: 700, fontSize: 13, color: '#a5a8c1' }}>
            URL du dépôt GitHub
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" required style={{ marginTop: 6 }} />
          </label>
          <button className="primary" style={{ width: '100%', justifyContent: 'center' }}><GitFork size={17}/> Analyser le dépôt</button>
        </form>}
        {state === 'loading' && <div className="center" style={{ minHeight: 160 }}><Sparkles className="spin" /> Analyse du dépôt…</div>}
        {state === 'done' && result && <>
          <div className="setting-row"><span>Dépôt</span><b><a href={result.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>{result.owner}/{result.repo}</a></b></div>
          {result.description && <div className="setting-row"><span>Description</span><b style={{ fontWeight: 400, textAlign: 'right', maxWidth: '60%' }}>{result.description}</b></div>}
          <div className="setting-row"><span>Language</span><b>{result.language}</b></div>
          {result.stacks.length > 0 && <div className="setting-row"><span>Stack détecté</span><b style={{ fontWeight: 400, maxWidth: '60%', textAlign: 'right' }}>{result.stacks.join(', ')}</b></div>}
          <div className="setting-row"><span>Workflows générés</span><b>{result.workflows.length}</b></div>
          <div style={{ marginTop: 16, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.workflows.map((w, i) => <div key={i} style={{ background: '#11121a', border: '1px solid #303246', borderRadius: 10, padding: 12 }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{w.title}</div>
              <div style={{ color: '#7e829f', fontSize: 12, marginBottom: 6 }}>{w.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{w.tags.map((t, j) => <span key={j} style={{ fontSize: 11, background: '#222337', border: '1px solid #2d3048', color: '#868baf', borderRadius: 99, padding: '2px 8px' }}>#{t}</span>)}</div>
            </div>)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setState('idle'); setResult(null) }}>Analyser un autre dépôt</button>
            <button className="primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleImportAll}><Plus size={17}/> Tout importer ({result.workflows.length})</button>
          </div>
        </>}
        {state === 'saving' && <div className="center" style={{ minHeight: 160 }}><Sparkles className="spin" /> Importation…</div>}
      </div>
    </section>
  </div>
}

function EmptyState({ onReset, onCreate }) {
  return <section className="empty"><Search size={28}/><h2>Aucun workflow trouvé</h2><p>Modifie tes filtres ou crée le workflow qui manque à ta bibliothèque.</p><div><button className="secondary" onClick={onReset}>Réinitialiser</button><button className="primary" onClick={onCreate}><Plus size={17}/> Nouveau workflow</button></div></section>
}

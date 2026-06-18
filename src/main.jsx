import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { Bot, Check, ChevronDown, Clock3, Copy, Grid3X3, LogOut, Plus, Search, Settings, Sparkles, Star, Tags, Trash2, Wand2, X } from 'lucide-react'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const CATEGORIES = ['Analyse', 'Automatisation', 'Code', 'Créatif', 'Débogage', 'Documentation', 'Formation', 'Général']
const COLORS = { Analyse: '#f59e0b', Automatisation: '#8b5cf6', Code: '#10b981', Créatif: '#ec4899', Débogage: '#ef4444', Documentation: '#0ea5e9', Formation: '#14b8a6', Général: '#6366f1' }
const DEMO_WORKFLOWS = [
  { id: 'demo-1', title: 'Générateur de Workflow IA Multi-Étapes', description: 'Conçois un workflow complet avec objectifs, agents, entrées/sorties et critères de validation.', content: 'Agis comme un architecte IA senior. Crée un workflow étape par étape pour automatiser un processus métier. Inclus: contexte, déclencheur, agents IA, outils, garde-fous, format de sortie JSON et checklist qualité.', category: 'Automatisation', model: 'Claude 3.5 Sonnet', tags: ['agent', 'workflow', 'automation'], favorite: true, usage_count: 7, created_at: new Date().toISOString() },
  { id: 'demo-2', title: 'Revue de Code & Détection de Régressions', description: 'Analyse DDD, sécurité, performance et lisibilité avant merge.', content: 'Tu es un ingénieur logiciel principal. Analyse ce diff et retourne: risques, bugs probables, dette technique, tests manquants, recommandations concrètes et patchs si nécessaire.', category: 'Code', model: 'GPT-4.1', tags: ['code', 'review', 'ddd'], favorite: true, usage_count: 4, created_at: new Date(Date.now() - 864e5).toISOString() },
  { id: 'demo-3', title: 'Assistant Documentation Produit', description: 'Transforme des notes en documentation claire et actionnable.', content: 'À partir des notes ci-dessous, rédige une documentation structurée avec aperçu, prérequis, étapes, exemples, FAQ et section dépannage.', category: 'Documentation', model: 'Claude 3.5 Sonnet', tags: ['docs', 'readme'], favorite: false, usage_count: 2, created_at: new Date(Date.now() - 1728e5).toISOString() }
]

const blankForm = { title: '', description: '', content: '', category: 'Général', model: '', tagsText: '', favorite: false }

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workflows, setWorkflows] = useState(DEMO_WORKFLOWS)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Tous les workflows')
  const [sort, setSort] = useState('recent')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMode, setAuthMode] = useState('signin')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) loadWorkflows() }, [session])

  async function loadWorkflows() {
    const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false })
    if (!error) setWorkflows(data || [])
  }

  async function handleAuth(e) {
    e.preventDefault(); setMessage('')
    if (!supabase) return setMessage('Configure VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer Supabase.')
    const fn = authMode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { error } = await fn({ email: authEmail, password: authPassword })
    setMessage(error ? error.message : authMode === 'signin' ? 'Connexion réussie.' : 'Compte créé. Vérifie ton email si la confirmation est activée.')
  }

  const stats = useMemo(() => ({
    total: workflows.length,
    favs: workflows.filter(w => w.favorite).length,
    cats: CATEGORIES.map(c => ({ name: c, count: workflows.filter(w => w.category === c).length })),
    tags: [...new Set(workflows.flatMap(w => w.tags || []))].slice(0, 14)
  }), [workflows])

  const filtered = useMemo(() => workflows.filter(w => {
    const q = query.toLowerCase()
    const matchesQuery = [w.title, w.description, w.content, w.model, ...(w.tags || [])].join(' ').toLowerCase().includes(q)
    const matchesFilter = filter === 'Tous les workflows' || (filter === 'Favoris' ? w.favorite : w.category === filter || (w.tags || []).includes(filter))
    return matchesQuery && matchesFilter
  }).sort((a, b) => sort === 'popular' ? (b.usage_count || 0) - (a.usage_count || 0) : new Date(b.created_at) - new Date(a.created_at)), [workflows, query, filter, sort])

  function openModal(workflow) {
    setEditing(workflow || null)
    setForm(workflow ? { ...workflow, tagsText: (workflow.tags || []).join(', ') } : blankForm)
    setModalOpen(true)
  }

  async function saveWorkflow(e) {
    e.preventDefault()
    const payload = { title: form.title, description: form.description, content: form.content, category: form.category, model: form.model, favorite: form.favorite, tags: form.tagsText.split(',').map(t => t.trim()).filter(Boolean) }
    if (supabase && session) {
      const record = { ...payload, user_id: session.user.id }
      const { data, error } = editing?.id && !editing.id.startsWith('demo-')
        ? await supabase.from('workflows').update(record).eq('id', editing.id).select().single()
        : await supabase.from('workflows').insert(record).select().single()
      if (error) return setMessage(error.message)
      setWorkflows(prev => editing ? prev.map(w => w.id === editing.id ? data : w) : [data, ...prev])
    } else {
      const local = { ...payload, id: editing?.id || crypto.randomUUID(), created_at: editing?.created_at || new Date().toISOString(), usage_count: editing?.usage_count || 0 }
      setWorkflows(prev => editing ? prev.map(w => w.id === editing.id ? local : w) : [local, ...prev])
    }
    setModalOpen(false)
  }

  async function removeWorkflow(id) {
    if (supabase && session && !id.startsWith('demo-')) await supabase.from('workflows').delete().eq('id', id)
    setWorkflows(prev => prev.filter(w => w.id !== id))
  }

  async function toggleFavorite(w) {
    const updated = { ...w, favorite: !w.favorite }
    if (supabase && session && !w.id.startsWith('demo-')) await supabase.from('workflows').update({ favorite: updated.favorite }).eq('id', w.id)
    setWorkflows(prev => prev.map(item => item.id === w.id ? updated : item))
  }

  if (loading) return <div className="center"><Sparkles className="spin" /> Chargement…</div>

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><Bot size={22} /> <strong>DarkMedia · Workflow AI</strong></div>
      <small>VUE</small>
      <NavItem active={filter === 'Tous les workflows'} icon={<Grid3X3 />} label="Tous les workflows" count={stats.total} onClick={() => setFilter('Tous les workflows')} />
      <NavItem active={filter === 'Favoris'} icon={<Star />} label="Favoris" count={stats.favs} onClick={() => setFilter('Favoris')} />
      <small>CATÉGORIES</small>{stats.cats.map(c => <NavItem key={c.name} dot={COLORS[c.name]} active={filter === c.name} label={c.name} count={c.count} onClick={() => setFilter(c.name)} />)}
      <small>TAGS POPULAIRES</small>{stats.tags.map(t => <button className="tag-nav" key={t} onClick={() => setFilter(t)}><Tags size={14}/>{t}</button>)}
    </aside>

    <main>
      <header><div /> <div className="header-actions"><button className="icon"><Settings size={18}/></button>{session && <button className="icon" onClick={() => supabase.auth.signOut()}><LogOut size={18}/></button>}<button className="primary" onClick={() => openModal()}><Plus size={18}/> Nouveau workflow</button></div></header>
      <section className="hero"><div><p className="eyebrow">Bibliothèque privée Supabase</p><h1>Crée, organise et réutilise tes workflows IA.</h1><p>Une application complète avec authentification, recherche, catégories, favoris et sauvegarde cloud par utilisateur.</p></div><AuthBox {...{session, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode, handleAuth, message}} /></section>
      <div className="toolbar"><label><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher… (Ctrl+K)" /></label><select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Plus récents</option><option value="popular">Plus utilisés</option></select></div>
      <p className="count"><b>{filtered.length}</b> workflows</p>
      <section className="grid">{filtered.map(w => <WorkflowCard key={w.id} workflow={w} onEdit={() => openModal(w)} onDelete={() => removeWorkflow(w.id)} onFavorite={() => toggleFavorite(w)} />)}</section>
    </main>
    {modalOpen && <WorkflowModal form={form} setForm={setForm} onClose={() => setModalOpen(false)} onSubmit={saveWorkflow} editing={editing}/>} 
  </div>
}

function AuthBox({ session, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode, handleAuth, message }) {
  if (session) return <div className="auth-card"><Check/> Connecté<br/><span>{session.user.email}</span></div>
  return <form className="auth-card" onSubmit={handleAuth}><h3>Connexion Supabase</h3><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="email@domain.com" required/><input type="password" minLength="6" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Mot de passe" required/><button className="primary">{authMode === 'signin' ? 'Se connecter' : 'Créer un compte'}</button><button type="button" className="link" onClick={()=>setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'Créer un compte' : 'Déjà inscrit ?'}</button>{message && <p>{message}</p>}</form>
}
function NavItem({ icon, label, count, active, onClick, dot }) { return <button className={`nav ${active?'active':''}`} onClick={onClick}>{dot && <i style={{background:dot}}/>}{icon && React.cloneElement(icon,{size:16})}<span>{label}</span><b>{count}</b></button> }
function WorkflowCard({ workflow, onEdit, onDelete, onFavorite }) { return <article className="card" onDoubleClick={onEdit}><button className="star" onClick={onFavorite}><Star size={18} fill={workflow.favorite?'#f59e0b':'none'}/></button><h3>{workflow.title}</h3><p>{workflow.description}</p><pre>{workflow.content}</pre><div className="chips"><span style={{borderColor:COLORS[workflow.category],color:COLORS[workflow.category]}}>{workflow.category}</span>{workflow.model && <span>{workflow.model}</span>}{(workflow.tags||[]).slice(0,3).map(t=><span key={t}>#{t}</span>)}</div><footer><small><Clock3 size={13}/>{new Date(workflow.created_at).toLocaleDateString('fr-FR')} · {workflow.usage_count || 0} util.</small><div><button onClick={()=>navigator.clipboard.writeText(workflow.content)}><Copy size={15}/></button><button onClick={onEdit}><Wand2 size={15}/></button><button onClick={onDelete}><Trash2 size={15}/></button></div></footer></article> }
function WorkflowModal({ form, setForm, onClose, onSubmit, editing }) { return <div className="overlay"><form className="modal" onSubmit={onSubmit}><header><h2>{editing?'Modifier':'Nouveau workflow'}</h2><button type="button" onClick={onClose}><X/></button></header><details><summary><Sparkles size={16}/> Colle un texte — l'IA remplit le formulaire <ChevronDown size={16}/></summary><textarea placeholder="Colle tes notes ici puis transforme-les manuellement en workflow structuré." /></details><details><summary><Wand2 size={16}/> Améliore ce workflow — oriente l'AI <ChevronDown size={16}/></summary><input placeholder="Ex: rends-le plus orienté sécurité, DDD, SaaS…" /></details><label>Titre *<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex : Automatiser une revue de code" required /></label><label>Description courte<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="À quoi sert ce workflow ?" /></label><label>Contenu du workflow *<textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Colle ou écris ton workflow ici…" required /></label><div className="two"><label>Catégorie<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Modèle IA<input value={form.model || ''} onChange={e=>setForm({...form,model:e.target.value})} placeholder="Ex : claude-3, gpt-4, gemini…" /></label></div><label>Tags<input value={form.tagsText} onChange={e=>setForm({...form,tagsText:e.target.value})} placeholder="agent, architecture, sécurité" /></label><footer><button type="button" onClick={onClose}>Annuler</button><button className="primary"><Check size={17}/> Sauvegarder</button></footer></form></div> }

createRoot(document.getElementById('root')).render(<App />)

import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { 
  Shield, Award, Calendar, Users, BookOpen, AlertTriangle, 
  CheckCircle, Clock, User, LogOut 
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Simple pages for MVP
function Dashboard() {
  const { user: _user } = useAuth()
  
  // Mock data for now - will wire to Supabase user_certifications + new ceu_credits
  const myLicenses = [
    { name: 'Locksmith', state: 'VA', status: 'active', expiry: '2027-06-15', ceuRequired: 16, ceuEarned: 8, level: 'Renewal' },
    { name: 'Low Voltage', state: 'VA', status: 'active', expiry: '2026-12-01', ceuRequired: 8, ceuEarned: 8, level: 'Active' },
    { name: 'Guard Service', state: 'VA', status: 'expiring', expiry: '2026-06-30', ceuRequired: 12, ceuEarned: 4, level: 'Active' },
  ]

  const expiringCount = myLicenses.filter(l => l.status === 'expiring').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, Brian</h1>
          <p className="text-muted-foreground">Redex Education • CEU & License Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-brand text-brand">
            <Shield className="w-3 h-3 mr-1" /> 3 Licenses Active
          </Badge>
          {expiringCount > 0 && (
            <Badge variant="destructive" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" /> {expiringCount} Expiring Soon
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="w-4 h-4" /> Active Certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-brand">3</div>
            <p className="text-xs text-muted-foreground mt-1">All in good standing</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> CEU Hours Earned (YTD)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-400">12</div>
            <p className="text-xs text-muted-foreground mt-1">of 36 required across licenses</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Next Renewal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-400">Jun 30</div>
            <p className="text-xs text-muted-foreground mt-1">Guard Service • 8 CEU remaining</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Compliance Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">78%</div>
            <div className="w-full bg-white/10 h-1.5 rounded mt-2">
              <div className="bg-brand h-1.5 rounded w-[78%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Licenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand" /> My Licenses & Certifications
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/licenses">View All Details</Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {myLicenses.map((lic, i) => (
            <Card key={i} className={`bg-card/60 border-border/50 ${lic.status === 'expiring' ? 'border-amber-500/40' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{lic.name}</CardTitle>
                    <CardDescription>{lic.state} • {lic.level}</CardDescription>
                  </div>
                  <Badge 
                    variant={lic.status === 'active' ? 'default' : 'secondary'}
                    className={lic.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}
                  >
                    {lic.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Expires</span>
                  <span className="font-mono text-white">{new Date(lic.expiry).toLocaleDateString()}</span>
                </div>
                <div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>CEU Progress</span>
                    <span>{lic.ceuEarned} / {lic.ceuRequired} hrs</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded">
                    <div 
                      className={`h-2 rounded ${lic.ceuEarned >= lic.ceuRequired ? 'bg-emerald-500' : 'bg-brand'}`}
                      style={{ width: `${Math.min(100, (lic.ceuEarned / lic.ceuRequired) * 100)}%` }} 
                    />
                  </div>
                </div>
                {lic.status === 'expiring' && (
                  <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700" asChild>
                    <Link to="/credits">Record CEU or Renew →</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand" /> Recent CEU Activity
        </h2>
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-sm">
              {[
                { date: 'May 18, 2026', title: 'EliteCEU — Locksmith 8hr Renewal Module 2', hours: 8, status: 'Verified' },
                { date: 'May 12, 2026', title: 'EliteCEU — Locksmith 8hr Renewal Module 1', hours: 8, status: 'Verified' },
                { date: 'Apr 22, 2026', title: 'Internal — Redex Low Voltage Refresher', hours: 4, status: 'Approved' },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-white">{act.title}</div>
                    <div className="text-xs text-muted-foreground">{act.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-emerald-400">+{act.hours} hrs</span>
                    <Badge variant="outline" className="text-xs">{act.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LicensesPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">All Licenses & Requirements</h1>
      <p className="text-muted-foreground mb-8">State and role-based certification requirements for Redex field technicians.</p>
      <Card className="bg-card/60 border-border/50 p-8">
        <p className="text-center text-muted-foreground">License matrix and detailed requirement editor coming in next iteration.</p>
        <p className="text-center mt-4 text-xs">Currently tracking via Supabase user_certifications + skills.</p>
      </Card>
    </div>
  )
}

function CEUPage() {
  const [showUpload, setShowUpload] = useState(false)
  
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CEU Credit Ledger</h1>
          <p className="text-muted-foreground">Record and track continuing education hours from EliteCEU and approved providers.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-brand hover:bg-brand/90">
          <BookOpen className="w-4 h-4 mr-2" /> Record New CEU
        </Button>
      </div>

      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Connects to the same user_certifications and will soon have a dedicated ceu_credits table for granular hour tracking.</div>
        </CardContent>
      </Card>

      {showUpload && (
        <Card className="border-brand/30 bg-card/80">
          <CardHeader>
            <CardTitle>Upload CEU Completion</CardTitle>
            <CardDescription>For the recent Locksmith 16hr package or other providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">This will upload to Supabase Storage and create a record linked to your profile + skill_code (e.g. LOCKSMITH).</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button onClick={() => { toast.success('Recorded 8 CEU hours (demo)'); setShowUpload(false) }}>Submit (demo)</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <Users className="w-7 h-7 text-brand" /> Admin • Company Compliance
      </h1>
      <p className="text-muted-foreground mb-6">Management view: expiring licenses, bulk CEU assignment, audit exports.</p>
      <Card className="bg-card/60 border-border/50 p-8 text-center text-muted-foreground">
        Admin dashboard, technician matrix, and purchase recording UI will live here.
        <br />Shares the same Supabase backend as Redex Ops Hub.
      </Card>
    </div>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.info('Signed out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-brand flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">REDEX EDUCATION</div>
                <div className="text-[10px] text-muted-foreground -mt-1">CEU & License Portal</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/" className="hover:text-brand transition-colors">Dashboard</Link>
              <Link to="/licenses" className="hover:text-brand transition-colors">Licenses</Link>
              <Link to="/credits" className="hover:text-brand transition-colors">CEU Credits</Link>
              <Link to="/admin" className="hover:text-brand transition-colors">Admin</Link>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-muted-foreground">
        Redex Education • Internal tool for technician compliance & professional development • Shared data with Redex Ops Hub
      </footer>
    </div>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('blewis@goredex.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome to Redex Education')
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md px-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-semibold tracking-tighter">REDEX EDUCATION</div>
          </div>
        </div>

        <Card className="bg-card/70 border-border/60">
          <CardHeader>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>Access your licenses, CEU records, and renewal status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand" 
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand" 
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading || !password} className="w-full bg-brand hover:bg-brand/90 mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground pt-2">
                Uses the same Redex accounts as the Ops Hub
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-muted-foreground">Loading Redex Education...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          user ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/licenses" element={<LicensesPage />} />
                <Route path="/credits" element={<CEUPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App


import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { User, Bell, Shield, LogOut, Check, X, Loader2 } from 'lucide-react';
import { useUser, useClerk } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [notifSettings, setNotifSettings] = useState({ critical: true, digest: true, captcha: true, cluster: false, api: false });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectUrl: basePath || "/" });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  const toggleNotif = (key: keyof typeof notifSettings) =>
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Account';
  const displayEmail = user?.primaryEmailAddress?.emailAddress || '';
  const avatarInitial = (user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || 'A').toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
  const lastSignIn = user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sign out?</h2>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You'll be returned to the home page and will need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-3xl mx-auto space-y-6 relative pb-24">

        <div>
          <h1 className="text-2xl font-bold">Account & Profile</h1>
          <p className="text-muted-foreground text-sm">{displayEmail}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {user?.hasImage ? (
                <img src={user.imageUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{displayName}</h2>
                  <p className="text-muted-foreground text-sm">{displayEmail}</p>
                  <div className="inline-block bg-primary/20 text-primary text-xs px-2 py-0.5 rounded font-medium mt-2">
                    Free Plan
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Member since: {memberSince}</span>
                    <span>Last sign in: {lastSignIn}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'critical', label: 'Critical alerts', desc: 'Immediate email when bot cluster detected' },
              { key: 'digest', label: 'Weekly digest', desc: 'Traffic quality summary every Monday' },
              { key: 'captcha', label: 'CAPTCHA spike alerts', desc: 'When trigger rate exceeds 20%' },
              { key: 'cluster', label: 'New bot clusters', desc: 'When new fingerprint cluster is identified' },
              { key: 'api', label: 'API usage warnings', desc: 'When API quota reaches 80%' }
            ].map(item => (
              <div key={item.key} className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotif(item.key as keyof typeof notifSettings)}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    notifSettings[item.key as keyof typeof notifSettings] ? 'bg-primary justify-end' : 'bg-secondary/80 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Account Details</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs text-foreground/70 truncate max-w-[200px]">{user?.id || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Email verified</span>
              <span className={user?.primaryEmailAddress?.verification?.status === 'verified' ? 'text-green-400 font-medium' : 'text-yellow-400'}>
                {user?.primaryEmailAddress?.verification?.status === 'verified' ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Member since</span>
              <span>{memberSince}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm">Two-Factor Authentication</span>
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded font-medium">Disabled</span>
            </div>
            <button className="px-3 py-1.5 border border-border rounded-md text-sm font-medium hover:bg-secondary transition-colors">
              Enable 2FA
            </button>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium mb-2">Active Sessions</h4>
            <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border/50">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  Current session
                  <span className="bg-green-500/20 text-green-500 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Active</span>
                </div>
              </div>
              <button disabled className="px-2 py-1 text-xs border border-border rounded opacity-50 cursor-not-allowed">
                Revoke
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-red-900/30 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-sm">Delete Account</div>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes all data and configuration</p>
            </div>
            <button disabled title="Contact support" className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium opacity-50 cursor-not-allowed">
              Delete Account
            </button>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border hover:bg-secondary rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" /> Sign Out
            </button>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 md:left-56 right-0 bg-card border-t border-border p-4 flex justify-end items-center gap-4 z-10">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-500 text-sm font-medium animate-in fade-in">
            <Check className="w-4 h-4" /> Preferences saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </AppLayout>
  );
}

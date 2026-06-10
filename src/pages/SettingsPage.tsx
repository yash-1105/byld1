import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useNotificationPrefs, type NotificationPrefs } from '@/hooks/useNotificationPrefs';
import { supabase } from '@/integrations/supabase/client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Globe, Camera, Loader2, Pencil, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import UserAvatar from '@/components/UserAvatar';
import DriveIntegration from '@/components/drive/DriveIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CURRENCY_LABELS, type Currency, type Units, type DateFormat,
} from '@/lib/preferences';

const card = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay },
});

export default function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth();
  const { preferences, setPreference } = usePreferences();
  const { prefs: notifs, toggle: toggleNotif } = useNotificationPrefs();

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Edit-profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStudio, setEditStudio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change-password dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (!user) return null;

  const openEdit = () => {
    setEditName(user.name || '');
    setEditStudio(user.studio_name || '');
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingProfile(true);
    const { error } = await updateProfile({ name: editName.trim(), studio_name: editStudio.trim() });
    setSavingProfile(false);
    if (error) { toast.error(error); return; }
    toast.success('Profile updated');
    setEditOpen(false);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
      const { error } = await updateProfile({ avatarUrl: publicUrl });
      if (error) throw new Error(error);
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw === curPw) { toast.error('New password must differ from the current one'); return; }
    setSavingPw(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: curPw });
      if (verifyErr) { toast.error('Current password is incorrect'); return; }
      const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
      if (updErr) { toast.error(updErr.message); return; }
      toast.success('Password updated');
      setPwOpen(false);
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } finally {
      setSavingPw(false);
    }
  };

  const channelRows: { key: keyof NotificationPrefs; label: string }[] = [
    { key: 'email', label: 'Email notifications' },
    { key: 'push', label: 'Push notifications' },
  ];
  const eventRows: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'approvals', label: 'Approvals', desc: 'New requests and decisions' },
    { key: 'budgetAlerts', label: 'Budget alerts', desc: 'Overspend and milestone warnings' },
    { key: 'taskAssignments', label: 'Task assignments', desc: 'When a task is assigned to you' },
    { key: 'siteUpdates', label: 'Site updates', desc: 'New photos and progress logs' },
  ];

  return (
    <div className="space-y-6 max-w-2xl pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <motion.div {...card(0)} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Profile</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <UserAvatar initials={user.avatar} avatarUrl={user.avatarUrl} name={user.name} className="w-16 h-16 text-lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change photo"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">{user.name}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            <div className="text-xs text-primary capitalize mt-0.5">
              {user.role}{user.studio_name ? ` · ${user.studio_name}` : ''}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 shrink-0">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </motion.div>

      {/* Account & Security */}
      <motion.div {...card(0.1)} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Account &amp; Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <div className="text-sm font-medium text-foreground">Email</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <span className="text-xs text-muted-foreground">Read-only</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
            <div>
              <div className="text-sm font-medium text-foreground">Password</div>
              <div className="text-xs text-muted-foreground">Update your account password</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>Change password</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
            <div>
              <div className="text-sm font-medium text-foreground">Sign out</div>
              <div className="text-xs text-muted-foreground">End your session on this device</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-destructive hover:text-destructive gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div {...card(0.2)} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Saved on this device. No emails are sent in this demo.</p>

        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Channels</div>
        <div className="space-y-1 mb-4">
          {channelRows.map(row => (
            <div key={row.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <span className="text-sm text-foreground">{row.label}</span>
              <Switch checked={notifs[row.key]} onCheckedChange={() => toggleNotif(row.key)} />
            </div>
          ))}
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Events</div>
        <div className="space-y-1">
          {eventRows.map(row => (
            <div key={row.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div>
                <div className="text-sm text-foreground">{row.label}</div>
                <div className="text-xs text-muted-foreground">{row.desc}</div>
              </div>
              <Switch checked={notifs[row.key]} onCheckedChange={() => toggleNotif(row.key)} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div {...card(0.3)} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Project &amp; Regional</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">Measurement units</div>
              <div className="text-xs text-muted-foreground">Used for areas and dimensions</div>
            </div>
            <Select value={preferences.units} onValueChange={(v) => setPreference('units', v as Units)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (m, m²)</SelectItem>
                <SelectItem value="imperial">Imperial (ft, ft²)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">Currency</div>
              <div className="text-xs text-muted-foreground">Budgets, procurement, and costs</div>
            </div>
            <Select value={preferences.currency} onValueChange={(v) => setPreference('currency', v as Currency)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CURRENCY_LABELS) as Currency[]).map(c => (
                  <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">Date format</div>
              <div className="text-xs text-muted-foreground">How dates display across the app</div>
            </div>
            <Select value={preferences.dateFormat} onValueChange={(v) => setPreference('dateFormat', v as DateFormat)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div {...card(0.4)}>
        <h3 className="text-xl font-bold text-foreground mt-10 mb-4">Integrations</h3>
        <DriveIntegration />
      </motion.div>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your name and company. Email and role can't be changed here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-studio">Company / Studio</Label>
              <Input id="edit-studio" value={editStudio} onChange={e => setEditStudio(e.target.value)} placeholder="e.g. Maple Ridge Architects" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile} className="gap-1.5">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password, then choose a new one (min. 8 characters).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input id="confirm-pw" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={savingPw} className="gap-1.5">
              {savingPw && <Loader2 className="w-4 h-4 animate-spin" />} Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

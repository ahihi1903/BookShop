import { useCallback, useState } from 'react';
import { Check, Save } from 'lucide-react';
import PageState from '../components/PageState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { profileService } from '../services/profileService.js';
import { getErrorMessage, unwrapData } from '../utils/apiData.js';

export default function ProfilePage() {
  const load = useCallback(() => profileService.get(), []);
  const { data, loading, error, reload } = useApi(load);
  const { refreshUser } = useAuth();
  const user = data?.user ?? data;
  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  function profileValue(key) { return profile?.[key] ?? user?.[key] ?? ''; }
  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setProfileMessage(null);
    try {
      const payload = {
        name: profileValue('name').trim(),
        phone: profileValue('phone').trim() || null,
        address: profileValue('address').trim() || null,
      };
      await profileService.update(payload);
      await Promise.all([reload(), refreshUser()]);
      setProfile(null); setProfileMessage({ type: 'success', text: 'Thông tin cá nhân đã được cập nhật.' });
    } catch (requestError) { setProfileMessage({ type: 'error', text: getErrorMessage(requestError) }); }
    finally { setBusy(false); }
  }
  async function savePassword(event) {
    event.preventDefault(); setBusy(true); setPasswordMessage(null);
    if (password.newPassword !== password.confirmPassword) {
      setBusy(false); setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận chưa khớp.' }); return;
    }
    try {
      unwrapData(await profileService.changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }));
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Mật khẩu đã được thay đổi.' });
    } catch (requestError) { setPasswordMessage({ type: 'error', text: getErrorMessage(requestError) }); }
    finally { setBusy(false); }
  }

  return <div className="shell page-shell"><div className="screen-title"><div><p className="eyebrow">TÀI KHOẢN CỦA BẠN</p><h1>Thông tin cá nhân</h1><p className="screen-description">Quản lý thông tin liên hệ và bảo mật tài khoản BookShop.</p></div></div>
    <PageState loading={loading} error={error} empty={!loading && !error && !user ? 'Không tìm thấy hồ sơ.' : null}>{user && <div className="profile-page-grid"><form className="panel form-stack profile-edit-form" onSubmit={saveProfile}><div className="profile-heading"><div className="profile-avatar">{user.name?.slice(0, 1) || 'B'}</div><div><p className="eyebrow">HỒ SƠ THÀNH VIÊN</p><h2>{user.name}</h2><span>{user.email}</span></div></div><h3>Thông tin liên hệ</h3><label>Họ và tên<input required minLength="2" maxLength="120" value={profileValue('name')} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></label><label>Email<input value={user.email} disabled /></label><label>Số điện thoại<input maxLength="30" value={profileValue('phone')} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></label><label>Địa chỉ<textarea rows="3" maxLength="500" value={profileValue('address')} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} /></label>{profileMessage && <p className={profileMessage.type === 'success' ? 'inline-success' : 'inline-error'}>{profileMessage.type === 'success' && <Check size={15} />}{profileMessage.text}</p>}<button className="button button-primary" disabled={busy}><Save size={16} /> Lưu hồ sơ</button><div className="profile-membership-info"><span><strong>{user.points ?? 0}</strong> điểm</span><span><strong>{user.membershipLevel || 'BRONZE'}</strong> hạng thành viên</span></div></form>
      <form className="panel form-stack password-form" onSubmit={savePassword}><p className="eyebrow">BẢO MẬT</p><h2>Đổi mật khẩu</h2><p className="muted">Dùng mật khẩu dài và khó đoán để bảo vệ tài khoản.</p><label>Mật khẩu hiện tại<input required type="password" autoComplete="current-password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label><label>Mật khẩu mới<input required minLength="8" type="password" autoComplete="new-password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label><label>Xác nhận mật khẩu mới<input required minLength="8" type="password" autoComplete="new-password" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /></label>{passwordMessage && <p className={passwordMessage.type === 'success' ? 'inline-success' : 'inline-error'}>{passwordMessage.type === 'success' && <Check size={15} />}{passwordMessage.text}</p>}<button className="button button-outline" disabled={busy}>Cập nhật mật khẩu</button></form></div>}</PageState>
  </div>;
}

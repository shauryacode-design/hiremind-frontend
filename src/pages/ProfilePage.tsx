import React, { useState, useEffect } from 'react';
import { profileApi } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';
import { UserUpdate } from '../types';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<UserUpdate>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });

  const [originalData, setOriginalData] = useState<UserUpdate>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
      });
      setOriginalData({
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await profileApi.updateProfile(formData);
      await refreshUser();
      setOriginalData(formData);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Account Information</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-slate-600">{user?.email}</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          {/* First Name */}
          <div>
            <label className="input-label flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="input-field"
                disabled={isSaving}
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
                {user?.first_name}
              </div>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="input-label flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="input-field"
                disabled={isSaving}
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
                {user?.last_name}
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="input-label flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <div className="p-3 bg-slate-50 rounded-lg text-slate-900 flex items-center gap-2">
              {user?.email}
              <span className="text-xs text-slate-500">(Read-only)</span>
            </div>
          </div>

          {/* Account Created */}
          <div>
            <label className="input-label flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </label>
            <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
              {formatDate(user?.created_at)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Security Info */}
      <div className="card">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Security</h2>
        <div className="space-y-3 text-slate-600">
          <p>• Your password is securely hashed and stored</p>
          <p>• Authentication is handled via JWT tokens</p>
          <p>• Your data is encrypted in transit</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
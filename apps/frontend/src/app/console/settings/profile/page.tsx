'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Building2, Save, X, Upload, Camera } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  company?: string;
  role: string;
  createdAt: string;
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me');
      const data = await response.json();

      if (data.user) {
        // Map API response (snake_case) to interface (camelCase)
        const mappedProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          avatarUrl: data.user.avatar_url,
          bio: data.user.bio,
          phone: data.user.phone,
          company: data.user.company,
          role: data.user.role || 'OPERATOR',
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        setProfile(mappedProfile);
        setFormData({
          firstName: mappedProfile.firstName || '',
          lastName: mappedProfile.lastName || '',
          email: mappedProfile.email || '',
          phone: mappedProfile.phone || '',
          company: mappedProfile.company || '',
          bio: mappedProfile.bio || '',
          avatarUrl: mappedProfile.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company: profile.company || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your personal information and profile details</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Avatar Section */}
          <Card className="bg-[#1E293B] border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {formData.avatarUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
                    <Image
                      src={formData.avatarUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
              <div>
                <Button type="button" variant="outline" className="border-gray-700 text-gray-300 mb-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-sm text-gray-400">
                  JPG, GIF or PNG. Max size 2MB.
                </p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="bg-[#1E293B] border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Company
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white"
                  placeholder="Your company name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="bg-[#0F172A] border-gray-700 text-white min-h-[100px]"
                  placeholder="Tell us about yourself..."
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.bio.length}/1000 characters
                </p>
              </div>
            </div>
          </Card>

          {/* Account Information (Read-only) */}
          <Card className="bg-[#1E293B] border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Username
                </label>
                <div className="bg-[#0F172A] border border-gray-700 rounded px-3 py-2 text-gray-500">
                  {profile?.username}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Role
                </label>
                <div className="bg-[#0F172A] border border-gray-700 rounded px-3 py-2 text-gray-500 capitalize">
                  {profile?.role}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Member Since
                </label>
                <div className="bg-[#0F172A] border border-gray-700 rounded px-3 py-2 text-gray-500">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  User ID
                </label>
                <div className="bg-[#0F172A] border border-gray-700 rounded px-3 py-2 text-gray-500 font-mono text-xs">
                  {profile?.id}
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={saving}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

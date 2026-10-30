
import React, { useEffect, useRef, useState } from 'react';
import {
  UserCircle,
  Camera,
  FileText,
  Upload,
  Save,
  ArrowLeft,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './profile.css';

const BUCKET_NAME = 'student-files';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Profile({ user }) {
  const navigate = useNavigate();

  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // Holds the latest paths immediately, without waiting for React state.
  const filePathsRef = useRef({
    avatar_url: '',
    resume_path: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    full_name: '',
    department: '',
    academic_year: '',
    bio: '',
    skills: [],
    avatar_url: '',
    resume_path: '',
  });

  const [skillsInput, setSkillsInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [resumeName, setResumeName] = useState('');

  // Load profile from Supabase.
  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const avatarPath = data.avatar_url || '';
      const resumePath = data.resume_path || '';

      filePathsRef.current = {
        avatar_url: avatarPath,
        resume_path: resumePath,
      };

      setProfile({
        full_name: data.full_name || '',
        department: data.department || '',
        academic_year: data.academic_year || '',
        bio: data.bio || '',
        skills: data.skills || [],
        avatar_url: avatarPath,
        resume_path: resumePath,
      });

      setSkillsInput((data.skills || []).join(', '));

      if (avatarPath) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(avatarPath, 3600);

        if (!active) return;

        if (signedError) {
          setError(`Could not load profile photo: ${signedError.message}`);
        } else if (signedData?.signedUrl) {
          setAvatarPreview(signedData.signedUrl);
        }
      }

      if (resumePath) {
        setResumeName(resumePath.split('/').pop());
      }

      if (active) setLoading(false);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Upload profile photo or resume.
  const uploadFile = async (file, fileType) => {
    setError('');
    setMessage('');

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be 5 MB or less.');
      return;
    }

    const isAvatar = fileType === 'avatar';

    if (
      isAvatar &&
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    ) {
      setError('Profile photo must be JPG, PNG or WebP.');
      return;
    }

    if (!isAvatar && file.type !== 'application/pdf') {
      setError('Please upload your resume in PDF format.');
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    const fileName = `${fileType}-${Date.now()}.${extension}`;
    const filePath = `${user.id}/${fileName}`;

    if (isAvatar) {
      setUploadingAvatar(true);
    } else {
      setUploadingResume(true);
    }

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update ref immediately so Save always reads the latest path.
      filePathsRef.current = {
        ...filePathsRef.current,
        [isAvatar ? 'avatar_url' : 'resume_path']: filePath,
      };

      setProfile((previous) => ({
        ...previous,
        [isAvatar ? 'avatar_url' : 'resume_path']: filePath,
      }));

      if (isAvatar) {
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setResumeName(file.name);
      }

      setMessage(
        isAvatar
          ? 'Profile photo uploaded. Remember to save your changes.'
          : 'Resume uploaded. Remember to save your changes.'
      );
    } catch (uploadError) {
      setError(uploadError.message || 'File upload failed.');
    } finally {
      setUploadingAvatar(false);
      setUploadingResume(false);
    }
  };

  // Save profile details and file paths.
  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    const avatarPath = filePathsRef.current.avatar_url;
    const resumePath = filePathsRef.current.resume_path;

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          department: profile.department.trim(),
          academic_year: profile.academic_year,
          bio: profile.bio.trim(),
          skills,
          avatar_url: avatarPath,
          resume_path: resumePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id, avatar_url, resume_path')
        .single();

      if (updateError) {
        throw updateError;
      }

      // Keep local state in sync with the confirmed database values.
      filePathsRef.current = {
        avatar_url: data.avatar_url || '',
        resume_path: data.resume_path || '',
      };

      setProfile((previous) => ({
        ...previous,
        skills,
        avatar_url: data.avatar_url || '',
        resume_path: data.resume_path || '',
      }));

      setMessage('Your profile has been saved successfully!');
    } catch (saveError) {
      setError(saveError.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveResume = () => {
    filePathsRef.current = {
      ...filePathsRef.current,
      resume_path: '',
    };

    setProfile((previous) => ({
      ...previous,
      resume_path: '',
    }));

    setResumeName('');
    setMessage('Resume removal pending. Save your profile to confirm.');
  };

  const handleViewResume = async () => {
    if (!filePathsRef.current.resume_path) return;

    setError('');

    const { data, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePathsRef.current.resume_path, 3600);

    if (signedError) {
      setError(signedError.message);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle className="spin" size={28} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <button
          type="button"
          className="profile-back-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <h1>My Profile</h1>
        <p>Manage your student identity and professional information.</p>
      </div>

      {error && (
        <div className="profile-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="profile-alert success">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      <form className="profile-form" onSubmit={handleSave}>
        <section className="profile-card profile-photo-section">
          <div className="profile-section-heading">
            <UserCircle size={20} />
            <div>
              <h2>Profile Photo</h2>
              <p>Let people recognize you on UniVerse.</p>
            </div>
          </div>

          <div className="profile-photo-content">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Student profile" />
              ) : (
                <UserCircle size={65} strokeWidth={1.2} />
              )}
            </div>

            <div>
              <button
                type="button"
                className="profile-secondary-btn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Camera size={16} />
                )}
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </button>

              <p className="profile-hint">
                JPG, PNG or WebP · Maximum 5 MB
              </p>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  uploadFile(event.target.files?.[0], 'avatar');
                  event.target.value = '';
                }}
              />
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-section-heading">
            <UserCircle size={20} />
            <div>
              <h2>Personal Information</h2>
              <p>Your basic student details.</p>
            </div>
          </div>

          <div className="profile-fields-grid">
            <div className="profile-field">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="email">College Email</label>
              <input
                id="email"
                value={user?.email || ''}
                disabled
                readOnly
              />
              <span className="profile-hint">Verified account email</span>
            </div>

            <div className="profile-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={profile.department}
                onChange={handleChange}
                placeholder="e.g. Computer Engineering"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="academic_year">Academic Year</label>
              <select
                id="academic_year"
                name="academic_year"
                value={profile.academic_year}
                onChange={handleChange}
              >
                <option value="">Select academic year</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
              </select>
            </div>
          </div>

          <div className="profile-field profile-full-field">
            <label htmlFor="bio">About Me</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Tell your campus community a little about yourself..."
              rows={4}
              maxLength={500}
            />
            <span className="profile-hint">
              {profile.bio.length}/500 characters
            </span>
          </div>

          <div className="profile-field profile-full-field">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              value={skillsInput}
              onChange={(event) => setSkillsInput(event.target.value)}
              placeholder="React, Java, UI/UX, Python..."
            />
            <span className="profile-hint">
              Separate your skills with commas.
            </span>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-section-heading">
            <FileText size={20} />
            <div>
              <h2>Resume</h2>
              <p>Keep your latest resume ready for opportunities.</p>
            </div>
          </div>

          <div className="resume-upload-area">
            {profile.resume_path ? (
              <div className="resume-file">
                <FileText size={28} />
                <div className="resume-file-info">
                  <strong>{resumeName || 'Uploaded resume'}</strong>
                  <span>PDF document</span>
                </div>

                <button
                  type="button"
                  className="resume-view-btn"
                  onClick={handleViewResume}
                >
                  View
                </button>

                <button
                  type="button"
                  className="resume-remove-btn"
                  onClick={handleRemoveResume}
                  aria-label="Remove resume"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="resume-empty">
                <Upload size={28} />
                <strong>No resume uploaded yet</strong>
                <span>Upload your resume in PDF format.</span>
              </div>
            )}

            <button
              type="button"
              className="profile-secondary-btn"
              onClick={() => resumeInputRef.current?.click()}
              disabled={uploadingResume}
            >
              {uploadingResume ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              {uploadingResume ? 'Uploading...' : 'Upload Resume'}
            </button>

            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(event) => {
                uploadFile(event.target.files?.[0], 'resume');
                event.target.value = '';
              }}
            />

            <p className="profile-hint">
              PDF only · Maximum 5 MB
            </p>
          </div>
        </section>

        <div className="profile-save-row">
          <button
            type="button"
            className="profile-cancel-btn"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="profile-save-btn"
            disabled={saving || uploadingAvatar || uploadingResume}
          >
            {saving ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

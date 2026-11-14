import React, { useState, useEffect, useRef } from 'react';
import {
  supabase,
  getHomeVideo,
  updateHomeVideo,
  extractYouTubeId,
  defaultHomeVideo,
  type HomeVideoData
} from '../../lib/supabase';
import {
  Film,
  Youtube,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_SIZE_MB = 30;

export const HomeVideoManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [sourceType, setSourceType] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [lastSavedData, setLastSavedData] = useState<HomeVideoData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  // Derived YouTube ID
  const detectedYouTubeId = sourceType === 'youtube' ? extractYouTubeId(youtubeUrl) : null;

  // Load current settings on mount
  useEffect(() => {
    fetchVideoSettings();
  }, []);

  const fetchVideoSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHomeVideo();
      setSourceType(data.source_type);
      if (data.source_type === 'youtube') {
        setYoutubeUrl(data.url);
        setUploadedVideoUrl(defaultHomeVideo.url);
      } else {
        setUploadedVideoUrl(data.url);
        setYoutubeUrl('');
      }
      setPosterUrl(data.poster_url || '');
      setTitle(data.title || defaultHomeVideo.title || 'A closer look.');
      setSubtitle(data.subtitle || defaultHomeVideo.subtitle || '04 / Our design language');
      setLastSavedData(data);
    } catch (err: any) {
      console.error('Error fetching home video settings:', err);
      setError('Could not load current video settings.');
    } finally {
      setLoading(false);
    }
  };

  // Handle video file selection with strict 30MB check
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    // Validate 30MB file size limit
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(
        `File size exceeds the 30MB limit. Selected video is ${actualSizeMB}MB. Please compress or choose a file under 30MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate video mime types
    const validMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setError('Unsupported video format. Please upload MP4, WebM, or MOV files.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB) to Cloudflare R2...`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload video to Cloudflare R2');
      }

      setUploadedVideoUrl(result.url);
      setSourceType('upload');
      setSuccessMessage(`Video uploaded to Cloudflare R2! Click "Save Video Settings" to apply.`);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setError(err?.message || 'Video upload failed. Please verify credentials or try a smaller file.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle optional custom poster image upload
  const handlePosterSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Poster image exceeds 10MB limit.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Uploading custom poster to Cloudflare R2...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload poster image');
      }

      setPosterUrl(result.url);
      setSuccessMessage('Poster image uploaded.');
    } catch (err: any) {
      console.error('Poster upload failed:', err);
      setError(err?.message || 'Poster upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (posterInputRef.current) posterInputRef.current.value = '';
    }
  };

  // Use YouTube MaxRes Thumbnail as Poster
  const handleUseYouTubeThumbnail = () => {
    if (detectedYouTubeId) {
      const ytThumb = `https://img.youtube.com/vi/${detectedYouTubeId}/maxresdefault.jpg`;
      setPosterUrl(ytThumb);
      setSuccessMessage('Updated poster to YouTube high-resolution thumbnail.');
    }
  };

  // Save settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (sourceType === 'youtube') {
      if (!youtubeUrl.trim()) {
        setError('Please enter a YouTube video URL.');
        return;
      }
      if (!detectedYouTubeId) {
        setError('Invalid YouTube URL. Please provide a standard watch, share, or shorts link.');
        return;
      }
    } else {
      if (!uploadedVideoUrl.trim()) {
        setError('Please upload a video file or provide a video URL.');
        return;
      }
    }

    setSaving(true);
    try {
      const activeUrl = sourceType === 'youtube' ? youtubeUrl.trim() : uploadedVideoUrl.trim();
      const payload: HomeVideoData = {
        source_type: sourceType,
        url: activeUrl,
        youtube_id: detectedYouTubeId || undefined,
        poster_url: posterUrl.trim() || undefined,
        title: title.trim() || 'A closer look.',
        subtitle: subtitle.trim() || '04 / Our design language'
      };

      const result = await updateHomeVideo(payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings.');
      }

      setLastSavedData(payload);
      setSuccessMessage('Homepage video settings updated successfully! Live site updated.');
    } catch (err: any) {
      console.error('Error saving home video settings:', err);
      setError(err?.message || 'Could not save video settings.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default local sample video
  const handleResetToDefault = () => {
    if (confirm('Reset to the default ROEL visual concept video (/videos/video.mp4)?')) {
      setSourceType('upload');
      setUploadedVideoUrl(defaultHomeVideo.url);
      setPosterUrl(defaultHomeVideo.poster_url || '');
      setTitle(defaultHomeVideo.title || 'A closer look.');
      setSubtitle(defaultHomeVideo.subtitle || '04 / Our design language');
      setYoutubeUrl('');
      setSuccessMessage('Reset fields to defaults. Remember to click "Save Video Settings" to apply.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '350px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2
            style={{
              width: '32px',
              height: '32px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
              color: '#D49E58'
            }}
          />
          <p style={{ margin: 0, fontSize: '13px', color: '#806957' }}>
            Loading Home Video Configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FAF7F2',
          border: '1px solid rgba(118, 89, 65, 0.18)',
          borderRadius: '4px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Film style={{ width: '22px', height: '22px', color: '#765941' }} />
            <h1
              style={{
                fontFamily: 'RoelSerif, Georgia, serif',
                fontSize: '26px',
                fontWeight: 600,
                color: '#14110E',
                margin: 0
              }}
            >
              Home Screen Video & Brand Film
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#806957', maxWidth: '720px', lineHeight: 1.6 }}>
            Manage the visual study video featured in Section 04 on the homepage. You can either paste a public
            YouTube link or upload a video file up to <strong>30MB</strong> directly to Cloudflare R2 storage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/#inline-film-container"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '9px 16px',
              backgroundColor: '#fff',
              color: '#765941',
              border: '1px solid rgba(118, 89, 65, 0.25)',
              borderRadius: '4px',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ExternalLink style={{ width: '13px', height: '13px' }} />
            View on Live Homepage
          </a>

          <button
            type="button"
            onClick={handleResetToDefault}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              padding: '9px 14px',
              backgroundColor: 'transparent',
              color: '#806957',
              border: '1px solid rgba(118, 89, 65, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw style={{ width: '13px', height: '13px' }} />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '4px',
            color: '#991B1B',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '4px',
            color: '#166534',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave}>
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid rgba(118, 89, 65, 0.18)',
            borderRadius: '4px',
            padding: '28px'
          }}
        >
          {/* Step 1: Select Video Source */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#765941',
                marginBottom: '12px'
              }}
            >
              1. Choose Video Source
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}
            >
              {/* Option A: YouTube URL */}
              <button
                type="button"
                onClick={() => setSourceType('youtube')}
                style={{
                  padding: '18px 20px',
                  backgroundColor: sourceType === 'youtube' ? 'rgba(212, 158, 88, 0.08)' : '#FAF7F2',
                  border: `2px solid ${sourceType === 'youtube' ? '#D49E58' : 'rgba(118, 89, 65, 0.15)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: sourceType === 'youtube' ? '#EF4444' : '#E5D6C5',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  <Youtube style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#14110E' }}>
                      Paste YouTube URL
                    </span>
                    {sourceType === 'youtube' && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#806957', lineHeight: 1.5 }}>
                    Stream from any YouTube video (public/unlisted). Zero bandwidth limit, fast global CDN streaming.
                  </p>
                </div>
              </button>

              {/* Option B: Direct Video Upload */}
              <button
                type="button"
                onClick={() => setSourceType('upload')}
                style={{
                  padding: '18px 20px',
                  backgroundColor: sourceType === 'upload' ? 'rgba(212, 158, 88, 0.08)' : '#FAF7F2',
                  border: `2px solid ${sourceType === 'upload' ? '#D49E58' : 'rgba(118, 89, 65, 0.15)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: sourceType === 'upload' ? '#765941' : '#E5D6C5',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  <UploadCloud style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#14110E' }}>
                      Upload Video File (Max 30MB)
                    </span>
                    {sourceType === 'upload' && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#765941',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#806957', lineHeight: 1.5 }}>
                    Upload an MP4, WebM or MOV file directly to Cloudflare R2 bucket. Max size: <strong>30MB</strong>.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Configure Inputs Based on Source */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118, 89, 65, 0.15)',
              borderRadius: '4px',
              marginBottom: '28px'
            }}
          >
            {sourceType === 'youtube' ? (
              <div>
                <label
                  htmlFor="youtube-url-input"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#14110E',
                    marginBottom: '8px'
                  }}
                >
                  YouTube Video Link or Video ID
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    id="youtube-url-input"
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      fontSize: '14px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#14110E',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  {detectedYouTubeId && (
                    <button
                      type="button"
                      onClick={handleUseYouTubeThumbnail}
                      title="Use the high-res YouTube thumbnail as the video poster"
                      style={{
                        padding: '12px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#fff',
                        border: '1px solid rgba(118, 89, 65, 0.25)',
                        borderRadius: '4px',
                        color: '#765941',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Use YouTube Poster
                    </button>
                  )}
                </div>

                {/* Validation Badge */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {detectedYouTubeId ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#166534',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                      Detected Video ID: <code style={{ backgroundColor: '#DCFCE7', padding: '1px 5px', borderRadius: '3px' }}>{detectedYouTubeId}</code>
                    </span>
                  ) : youtubeUrl.trim().length > 0 ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#B91C1C',
                        fontWeight: 500
                      }}
                    >
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      Could not detect a valid YouTube Video ID from this link.
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#806957' }}>
                      Supports standard URLs, shorts, embeds, or short links (youtu.be).
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#14110E',
                    marginBottom: '8px'
                  }}
                >
                  Direct Video File Upload (MP4 / WebM / MOV)
                </label>

                {/* Dropzone Box */}
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(118, 89, 65, 0.3)',
                    borderRadius: '4px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    cursor: uploading ? 'wait' : 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={handleVideoFileSelect}
                    style={{ display: 'none' }}
                  />

                  {uploading ? (
                    <div>
                      <Loader2
                        style={{
                          width: '32px',
                          height: '32px',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 10px',
                          color: '#D49E58'
                        }}
                      />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#765941' }}>
                        {uploadProgress || 'Uploading video to Cloudflare R2...'}
                      </p>
                      <span style={{ fontSize: '11px', color: '#806957' }}>
                        Please keep this tab open while uploading.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud
                        style={{
                          width: '36px',
                          height: '36px',
                          color: '#765941',
                          margin: '0 auto 10px',
                          display: 'block'
                        }}
                      />
                      <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#14110E' }}>
                        Click to select or drag & drop video file here
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#806957' }}>
                        Strict Limit: <strong>Maximum 30MB</strong> &bull; Supported: MP4, WebM, QuickTime
                      </p>
                    </div>
                  )}
                </div>

                {/* Current Video File URL */}
                <div style={{ marginTop: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#806957',
                      marginBottom: '4px'
                    }}
                  >
                    Current Video File URL (or paste external MP4 CDN link):
                  </label>
                  <input
                    type="text"
                    value={uploadedVideoUrl}
                    onChange={(e) => setUploadedVideoUrl(e.target.value)}
                    placeholder="https://pub-e465cd37fbf24a1491b461e2ef65364e.r2.dev/videos/... or /videos/video.mp4"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#14110E',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Video Poster / Thumbnail & Text */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '28px'
            }}
          >
            {/* Custom Poster Frame */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#765941',
                  marginBottom: '8px'
                }}
              >
                Custom Video Poster / Cover Image
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="/images/hero.webp or image URL"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2',
                    color: '#14110E',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#FAF7F2',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    borderRadius: '4px',
                    color: '#765941',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ImageIcon style={{ width: '14px', height: '14px' }} />
                  Upload
                </button>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePosterSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#806957' }}>
                Displays on the homepage before user hits play. Defaults to architectural hero preview.
              </span>
            </div>

            {/* Custom Section Headings */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#765941',
                  marginBottom: '8px'
                }}
              >
                Section Titles (Optional)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Eyebrow e.g. 04 / Our design language"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2',
                    color: '#14110E',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Heading e.g. A closer look."
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2',
                    color: '#14110E',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step 4: Live Interactive Preview */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#765941',
                marginBottom: '10px'
              }}
            >
              Interactive In-Dashboard Preview
            </label>

            <div
              style={{
                maxWidth: '780px',
                height: '380px',
                backgroundColor: '#19120C',
                border: '1px solid rgba(229, 191, 140, 0.25)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 12px 36px rgba(0,0,0,0.35)'
              }}
            >
              {sourceType === 'youtube' ? (
                detectedYouTubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${detectedYouTubeId}?rel=0&modestbranding=1`}
                    title="YouTube Video Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 0,
                      display: 'block'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'rgba(240, 226, 206, 0.6)',
                      fontSize: '13px'
                    }}
                  >
                    Enter a valid YouTube URL above to view the preview
                  </div>
                )
              ) : uploadedVideoUrl ? (
                <video
                  src={uploadedVideoUrl}
                  poster={posterUrl || undefined}
                  controls
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#19120C'
                  }}
                >
                  Your browser does not support HTML video preview.
                </video>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'rgba(240, 226, 206, 0.6)',
                    fontSize: '13px'
                  }}
                >
                  Upload a video file above to view the preview
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(118, 89, 65, 0.15)',
              paddingTop: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'inline-block'
                }}
              />
              <span style={{ fontSize: '12px', color: '#806957' }}>
                Status: {lastSavedData?.source_type === 'youtube' ? 'YouTube Streaming' : 'Direct MP4 File'}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                backgroundColor: '#D49E58',
                color: '#14110E',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: saving || uploading ? 'not-allowed' : 'pointer',
                opacity: saving || uploading ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(212, 158, 88, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {saving ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check style={{ width: '16px', height: '16px' }} />
                  Save Video Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

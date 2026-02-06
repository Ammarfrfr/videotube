import React, { useEffect, useState } from 'react'
import api from '../api'
import VideoCard from '../components/VideoCard'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home(){
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        // Fetch public feed
        const res = await api.get('/videos')
        const feed = res?.data?.data?.videos || res?.data?.videos || []

        // Also try to fetch the current user's uploads (some deployments return different datasets)
        let mine = []
        try {
          const mineRes = await api.get('/videos', { params: { userId: user?._id, page: 1, limit: 50 } })
          mine = mineRes?.data?.data?.videos || mineRes?.data?.videos || []
        } catch (e) {
          // ignore: backend may not return owner videos via this endpoint
          console.debug('Could not fetch user-specific videos', e?.response?.data || e.message || e)
        }

        // merge feed + mine, preferring feed order, and dedupe by _id
        const combined = []
        const seen = new Set()
        ;[...feed, ...mine].forEach(v => {
          if (!v) return
          if (!seen.has(v._id)) {
            seen.add(v._id)
            combined.push(v)
          }
        })

        setVideos(combined)

      } catch (err) {
        // show friendly message and attempt a fallback detailed fetch to help debugging
        const msg = err?.response?.data?.message || err.message || String(err)
        setError(msg)

        // fallback: try calling the API directly with fetch and Authorization header (helps when CORS/cookies are the issue)
        try {
          const API_BASE = import.meta.env.VITE_API_URL
          const token = localStorage.getItem('accessToken')
          const fallbackRes = await fetch(`${API_BASE}/api/v1/videos?page=1&limit=50`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          const text = await fallbackRes.text()
          console.debug('Fallback /videos response:', fallbackRes.status, text)
        } catch (fallbackErr) {
          console.debug('Fallback fetch failed', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    // wait for auth to finish. If user is present, fetch videos.
    if (!authLoading && user) {
      fetchVideos()
    }
    // if auth finished and no user, do not fetch (videos API is protected on backend)
  }, [authLoading, user])

  if (authLoading) return <p>Checking authentication...</p>

  if (!user) {
    return (
      <section className="home-section">
        <h2>Latest videos</h2>
        <p>
          You need to <Link to="/login">log in</Link> to see videos.
        </p>
      </section>
    )
  }

  return (
    <section className="home-section">
      <h2>Latest videos</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="home-error">Error: {error}</p>}
      <div className="home-list">
        {videos.map(v => (
          <VideoCard key={v._id} video={v} onDeleted={(id) => setVideos(prev => prev.filter(x => x._id !== id))} />
        ))}
      </div>
    </section>
  )
}

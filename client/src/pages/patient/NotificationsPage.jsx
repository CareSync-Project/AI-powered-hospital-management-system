import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    notificationService.list()
      .then((r) => {
        const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
        setItems(list);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const read = async (id) => {
    try {
      await notificationService.markRead(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const all = async () => {
    try {
      await notificationService.markAllRead();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="patient-panel">
      <div className="panel-heading">
        <h2>Notifications & Announcements</h2>
        {safeItems.some((x) => !x.read) && (
          <button onClick={all}>Mark all as read</button>
        )}
      </div>

      {error && <p className="patient-error">{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {safeItems.map((x) => (
          <article key={x.id} className={`notification-item ${x.read ? '' : 'unread'}`}>
            <div>
              <h3>{x.title}</h3>
              <p>{x.message}</p>
              <small>{new Date(x.createdAt).toLocaleString()}</small>
            </div>
            {!x.read && (
              <button onClick={() => read(x.id)} style={{ alignSelf: 'flex-start' }}>
                Mark read
              </button>
            )}
          </article>
        ))}
      </div>

      {!safeItems.length && (
        <p style={{ color: '#64748b', marginTop: '1rem' }}>No notifications or announcements yet.</p>
      )}
    </section>
  );
}

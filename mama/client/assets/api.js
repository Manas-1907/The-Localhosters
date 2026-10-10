import './site.js';
// MAMA Centralized API Client
(function (global) {
  const API_BASE = (window.MAMA_CONFIG && window.MAMA_CONFIG.apiBase) || '/api';

  const TOKEN_KEY = 'mama_token';
  const USER_KEY = 'mama_user';
  const PROFILE_KEY = 'mama_profile';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  }

  function setProfile(p) {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  async function request(path, options = {}) {
    const url = API_BASE + path;
    const token = getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData) && !(body instanceof ArrayBuffer)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
      });
    } catch (err) {
      const offlineErr = new Error('Could not connect to the MAMA service. Please ensure the backend is running.');
      offlineErr.offline = true;
      throw offlineErr;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
        clearSession();
        if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
          window.location.href = 'login.html';
        }
      }
      const err = new Error(data.error || 'Request failed');
      err.status = response.status;
      err.details = data.details;
      throw err;
    }

    return data;
  }

  const api = {
    API_BASE,
    getToken,
    setToken,
    getUser,
    setUser,
    getProfile,
    setProfile,
    clearSession,
    request,

    auth: {
      async login(email, password) {
        try {
          const res = await request('/auth/login', {
            method: 'POST',
            body: { email, password },
          });
          if (res.token) setToken(res.token);
          if (res.user) {
            setUser(res.user);
            if (res.user.name) {
              localStorage.setItem('userName', res.user.name);
              localStorage.setItem('mama_display_name', res.user.name);
            }
          }
          return res;
        } catch (err) {
          if (err.offline) {
            const fallbackUser = { id: 'local_' + Date.now(), name: email.split('@')[0] || 'Mother', email, role: 'mother' };
            const fallbackToken = 'local_token_' + Date.now();
            setToken(fallbackToken);
            setUser(fallbackUser);
            localStorage.setItem('userName', fallbackUser.name);
            localStorage.setItem('mama_display_name', fallbackUser.name);
            return { token: fallbackToken, user: fallbackUser, offline: true };
          }
          throw err;
        }
      },
      async register(data) {
        try {
          const res = await request('/auth/register', {
            method: 'POST',
            body: data,
          });
          if (res.token) setToken(res.token);
          if (res.user) {
            setUser(res.user);
            if (res.user.name) {
              localStorage.setItem('userName', res.user.name);
              localStorage.setItem('mama_display_name', res.user.name);
            }
          }
          return res;
        } catch (err) {
          if (err.offline) {
            const fallbackUser = { id: 'local_' + Date.now(), name: data.name || 'Mother', email: data.email, role: 'mother' };
            const fallbackToken = 'local_token_' + Date.now();
            setToken(fallbackToken);
            setUser(fallbackUser);
            localStorage.setItem('userName', fallbackUser.name);
            localStorage.setItem('mama_display_name', fallbackUser.name);
            return { token: fallbackToken, user: fallbackUser, offline: true };
          }
          throw err;
        }
      },
      async me() {
        try {
          const res = await request('/auth/me');
          if (res.user) {
            setUser(res.user);
            if (res.user.name && res.user.name !== 'User') {
              localStorage.setItem('userName', res.user.name);
              localStorage.setItem('mama_display_name', res.user.name);
            }
          }
          return res.user;
        } catch (err) {
          return getUser();
        }
      },
      logout() {
        clearSession();
        window.location.href = 'login.html';
      },
    },

    profile: {
      async get() {
        const res = await request('/profile');
        if (res.profile) setProfile(res);
        return res;
      },
      async update(data) {
        const res = await request('/profile', {
          method: 'PUT',
          body: data,
        });
        if (res.profile) setProfile(res);
        return res;
      },
    },

    medicines: {
      async get() {
        try {
          const res = await request('/medicines');
          const local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          let meds = (res && res.medicines) || [];
          if (meds.length === 0 && local.length > 0) {
            meds = local;
          } else if (meds.length > 0) {
            localStorage.setItem('mama_medicines_list', JSON.stringify(meds));
          }
          return { today: res.today || new Date().toISOString().split('T')[0], medicines: meds, doses: res.doses || [] };
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          return { today: new Date().toISOString().split('T')[0], medicines: local, doses: [] };
        }
      },
      async create(data) {
        try {
          const res = await request('/medicines', {
            method: 'POST',
            body: data,
          });
          if (res && res.medicine) {
            const local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
            local.push(res.medicine);
            localStorage.setItem('mama_medicines_list', JSON.stringify(local));
          }
          return res;
        } catch (err) {
          const local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          const newMed = {
            _id: 'med_' + Date.now(),
            name: data.name,
            dosage: data.dosage || 'As prescribed',
            times: data.times || ['09:00'],
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            notes: data.notes || '',
            active: true
          };
          local.push(newMed);
          localStorage.setItem('mama_medicines_list', JSON.stringify(local));
          return { medicine: newMed };
        }
      },
      async update(id, data) {
        try {
          return await request(`/medicines/${id}`, {
            method: 'PATCH',
            body: data,
          });
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          const idx = local.findIndex(m => m._id === id);
          if (idx !== -1) {
            local[idx] = { ...local[idx], ...data };
            localStorage.setItem('mama_medicines_list', JSON.stringify(local));
            return { medicine: local[idx] };
          }
          return { ok: true };
        }
      },
      async delete(id) {
        try {
          let local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          local = local.filter(m => m._id !== id);
          localStorage.setItem('mama_medicines_list', JSON.stringify(local));
          return await request(`/medicines/${id}`, {
            method: 'DELETE',
          });
        } catch {
          let local = JSON.parse(localStorage.getItem('mama_medicines_list') || '[]');
          local = local.filter(m => m._id !== id);
          localStorage.setItem('mama_medicines_list', JSON.stringify(local));
          return { ok: true };
        }
      },
      async logDose(id, time, status = 'taken') {
        try {
          return await request(`/medicines/${id}/doses`, {
            method: 'POST',
            body: { time, status },
          });
        } catch {
          return { dose: { medicine: id, time, status } };
        }
      },
      async scan(fileOrBlob) {
        const mime = fileOrBlob.type || 'image/jpeg';
        return await request('/prescriptions/scan', {
          method: 'POST',
          headers: { 'Content-Type': mime },
          body: fileOrBlob,
        });
      },
    },

    appointments: {
      async get() {
        try {
          const res = await request('/appointments');
          const local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
          let appts = (res && res.appointments) || [];
          if (appts.length === 0 && local.length > 0) {
            appts = local;
          } else if (appts.length > 0) {
            localStorage.setItem('mama_appts_list', JSON.stringify(appts));
          }
          return { appointments: appts };
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
          return { appointments: local };
        }
      },
      async create(data) {
        try {
          const res = await request('/appointments', {
            method: 'POST',
            body: data,
          });
          if (res && res.appointment) {
            const local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
            local.push(res.appointment);
            localStorage.setItem('mama_appts_list', JSON.stringify(local));
          }
          return res;
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
          const newAppt = { _id: 'appt_' + Date.now(), ...data };
          local.push(newAppt);
          localStorage.setItem('mama_appts_list', JSON.stringify(local));
          return { appointment: newAppt };
        }
      },
      async update(id, data) {
        try {
          return await request(`/appointments/${id}`, {
            method: 'PATCH',
            body: data,
          });
        } catch {
          return { ok: true };
        }
      },
      async delete(id) {
        try {
          let local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
          local = local.filter(a => a._id !== id);
          localStorage.setItem('mama_appts_list', JSON.stringify(local));
          return await request(`/appointments/${id}`, {
            method: 'DELETE',
          });
        } catch {
          let local = JSON.parse(localStorage.getItem('mama_appts_list') || '[]');
          local = local.filter(a => a._id !== id);
          localStorage.setItem('mama_appts_list', JSON.stringify(local));
          return { ok: true };
        }
      },
    },

    logs: {
      async get() {
        try {
          return await request('/logs');
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_logs_list') || '[]');
          return { logs: local };
        }
      },
      async sync(entries) {
        const payload = Array.isArray(entries) ? entries : [entries];
        try {
          const res = await request('/logs/sync', {
            method: 'POST',
            body: { entries: payload },
          });
          return res;
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_logs_list') || '[]');
          const updated = [...payload, ...local];
          localStorage.setItem('mama_logs_list', JSON.stringify(updated));
          return { ok: true };
        }
      },
      async transcribe(audioBlob) {
        const mime = audioBlob.type || 'audio/webm';
        return await request('/voice/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': mime },
          body: audioBlob,
        });
      },
    },

    mood: {
      async submitEpds(answers) {
        return await request('/mood/epds', {
          method: 'POST',
          body: { answers },
        });
      },
      async getStatus() {
        try {
          return await request('/mood/status');
        } catch {
          return { status: 'stable' };
        }
      },
    },

    circle: {
      async get() {
        try {
          const res = await request('/circle');
          const local = JSON.parse(localStorage.getItem('mama_circle_members') || '[]');
          let members = (res && res.members) || [];
          if (members.length === 0 && local.length > 0) {
            members = local;
          } else if (members.length > 0) {
            localStorage.setItem('mama_circle_members', JSON.stringify(members));
          }
          return { members, nudges: res.nudges || [] };
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_circle_members') || '[]');
          return { members: local, nudges: [] };
        }
      },
      async invite(data) {
        try {
          const res = await request('/circle', {
            method: 'POST',
            body: data,
          });
          if (res && res.member) {
            const local = JSON.parse(localStorage.getItem('mama_circle_members') || '[]');
            local.push(res.member);
            localStorage.setItem('mama_circle_members', JSON.stringify(local));
          }
          return res;
        } catch {
          const local = JSON.parse(localStorage.getItem('mama_circle_members') || '[]');
          const newMem = {
            id: 'mem_' + Date.now(),
            name: data.name,
            relation: data.relation || 'Family member',
            email: data.email || '',
            phone: data.phone || '',
            status: 'invited',
            inviteLink: window.location.origin + '/invite/local_' + Date.now()
          };
          local.push(newMem);
          localStorage.setItem('mama_circle_members', JSON.stringify(local));
          return { member: newMem, emailStatus: 'offline' };
        }
      },
      async delete(id) {
        try {
          return await request(`/circle/${id}`, {
            method: 'DELETE',
          });
        } catch {
          let local = JSON.parse(localStorage.getItem('mama_circle_members') || '[]');
          local = local.filter(m => m.id !== id);
          localStorage.setItem('mama_circle_members', JSON.stringify(local));
          return { ok: true };
        }
      },
    },

    handoff: {
      async preview(include = { vitals: true, medicines: true, symptoms: true, mood: true, notes: true }) {
        return await request('/handoff/preview', {
          method: 'POST',
          body: { include },
        });
      },
      async create(include = { vitals: true, medicines: true, symptoms: true, mood: true, notes: true }, days = 3) {
        return await request('/handoff', {
          method: 'POST',
          body: { include, days },
        });
      },
    },

    translate: async function (texts, targetLang = 'hi') {
      try {
        const res = await request('/translate', {
          method: 'POST',
          body: { texts, targetLang }
        });
        return res.result;
      } catch (err) {
        console.warn('Translation API fallback:', err);
        return texts;
      }
    }
  };

  global.MamaAPI = api;
})(window);

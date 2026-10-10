// MAMA Application Controller - Binds UI screens to the MAMA Backend API
(function () {
  const file = location.pathname.split('/').pop() || 'index.html';
  if (!window.MamaAPI) return;

  function toast(msg, isErr = false) {
    if (window.mamaToast) window.mamaToast(msg, isErr);
    else alert(msg);
  }

  // Helper to format date
  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  }

  function formatTime(d) {
    try {
      return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function getDoctorInfo() {
    const profile = window.MamaAPI.getProfile();
    return {
      name: localStorage.getItem('mama_doctor_name') || (profile && profile.profile && profile.profile.doctorName) || '',
      specialty: localStorage.getItem('mama_doctor_specialty') || 'OB/GYN',
      hospital: localStorage.getItem('mama_hospital') || (profile && profile.profile && profile.profile.hospital) || '',
      phone: localStorage.getItem('mama_doctor_phone') || (profile && profile.profile && profile.profile.doctorPhone) || '',
      email: localStorage.getItem('mama_doctor_email') || (profile && profile.profile && profile.profile.doctorEmail) || ''
    };
  }

  function saveDoctorInfo(info) {
    if (info.name !== undefined) localStorage.setItem('mama_doctor_name', info.name);
    if (info.specialty !== undefined) localStorage.setItem('mama_doctor_specialty', info.specialty);
    if (info.hospital !== undefined) localStorage.setItem('mama_hospital', info.hospital);
    if (info.phone !== undefined) localStorage.setItem('mama_doctor_phone', info.phone);
    if (info.email !== undefined) localStorage.setItem('mama_doctor_email', info.email);
  }

  // Get user name from localStorage or user object
  function getUserName() {
    const user = window.MamaAPI.getUser();
    const stored = localStorage.getItem('mama_display_name') || localStorage.getItem('userName');
    if (user && user.name && user.name !== 'User') return user.name;
    if (stored && stored !== 'User') return stored;
    return 'Mother';
  }

  // Get pregnancy week from profile
  function getWeek() {
    const profile = window.MamaAPI.getProfile();
    return (profile && profile.profile && profile.profile.currentWeek) || localStorage.getItem('mama_week') || '24';
  }

  // ==========================================
  // VOICE TRANSCRIPTION HELPER (with Web Speech API fallback)
  // ==========================================
  function startVoiceTranscription(onResult, onError, onStart, onStop) {
    // Try Web Speech API first (browser native, no server required)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';
      recognition.onstart = () => { if (onStart) onStart(); };
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (onResult) onResult(finalTranscript + interim, false);
      };
      recognition.onspeechend = () => {
        recognition.stop();
      };
      recognition.onend = () => {
        if (onStop) onStop(finalTranscript.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          if (onError) onError('Microphone access denied. Please allow microphone in your browser settings.');
        } else if (event.error === 'no-speech') {
          if (onStop) onStop(finalTranscript.trim());
        } else {
          if (onError) onError('Voice recognition error: ' + event.error);
        }
      };
      recognition.start();
      return recognition;
    } else {
      // Fallback: MediaRecorder + server transcription
      return null;
    }
  }

  function startMediaRecorderTranscription(noteArea, micBtn, toast) {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        toast('Transcribing voice note...');
        try {
          const res = await window.MamaAPI.logs.transcribe(audioBlob);
          if (res && res.text) {
            noteArea.value = (noteArea.value ? noteArea.value + ' ' : '') + res.text;
            toast('Voice note transcribed!');
          } else {
            toast('No speech detected in recording', true);
          }
        } catch (e) {
          toast('Voice transcription unavailable. Type your note instead.', true);
        }
      };
      mediaRecorder.start();
      return mediaRecorder;
    });
  }

  // ==========================================
  // 1. HOME SCREEN CONTROLLER
  // ==========================================
  if (file === 'home.html') {
    // Dynamically update user greeting
    const h1 = document.querySelector('main h1, header h1, .text-\\[34px\\]');
    if (h1) {
      const name = getUserName().split(' ')[0];
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      h1.textContent = `${greeting}, ${name} 🌸`;
    }

    // Mood map to integer (1-5)
    const moodMap = { 'calm': 5, 'good': 4, 'tired': 3, 'anxious': 1, 'uncomfortable': 2 };

    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', async function () {
        const moodKey = this.dataset.mood || 'good';
        const score = moodMap[moodKey] || 4;
        try {
          await window.MamaAPI.logs.sync({
            clientId: 'mood-' + Date.now(),
            loggedAt: new Date().toISOString(),
            source: 'text',
            mood: score,
            symptoms: [],
            vitals: {}
          });
        } catch (e) {
          console.warn('Mood sync:', e.message);
        }
      });
    });

    // Quick Actions
    document.querySelectorAll('section button').forEach(b => {
      const txt = b.textContent.toLowerCase();
      if (txt.includes('log how i feel')) {
        b.addEventListener('click', () => location.href = 'my-health.html');
      } else if (txt.includes('scan prescription')) {
        b.addEventListener('click', () => location.href = 'medicines.html');
      } else if (txt.includes('prepare for doctor')) {
        b.addEventListener('click', () => location.href = 'doctor-brief.html');
      }
    });

    // Load next upcoming appointment
    async function loadNextAppointment() {
      try {
        const data = await window.MamaAPI.appointments.get();
        const appts = data.appointments || [];
        const now = new Date();
        const upcoming = appts
          .filter(a => new Date(a.at) >= now && !a.done)
          .sort((a, b) => new Date(a.at) - new Date(b.at));

        const titleEl = document.getElementById('home-next-title');
        const subEl = document.getElementById('home-next-sub');

        if (upcoming.length > 0) {
          const next = upcoming[0];
          const doctorName = next.doctorName || getDoctorInfo().name || 'Your Doctor';
          const title = next.title || 'Prenatal Checkup';
          const dateStr = formatDate(next.at) + ' · ' + formatTime(next.at);
          const locStr = next.location || getDoctorInfo().hospital || 'Clinic';

          if (titleEl) titleEl.textContent = `${title} with ${doctorName}`;
          if (subEl) subEl.textContent = `${dateStr} · ${locStr}`;
        } else {
          if (titleEl) titleEl.textContent = 'No upcoming care visits scheduled';
          if (subEl) subEl.textContent = 'Tap "Schedule / View" to add your next appointment';
        }
      } catch (e) {
        console.warn('Error loading appointments:', e);
      }
    }

    // Load today's medication rhythm
    async function loadMedsRhythm() {
      try {
        const data = await window.MamaAPI.medicines.get();
        const meds = data.medicines || [];
        const doses = data.doses || [];
        const takenDoses = doses.filter(d => d.status === 'taken').length;

        // Calculate total expected doses today
        let totalDoses = 0;
        meds.forEach(m => {
          if (m.active !== false && Array.isArray(m.times)) {
            totalDoses += m.times.length;
          }
        });
        if (totalDoses === 0) totalDoses = meds.length || 2;

        document.querySelectorAll('section .grid div').forEach(box => {
          if (/Medication taken/i.test(box.textContent)) {
            const numEl = box.querySelector('.text-\\[30px\\], .text-\\[32px\\]');
            if (numEl) {
              numEl.innerHTML = `${takenDoses}<span class="text-[15px] font-normal text-muted"> / ${totalDoses}</span>`;
            }
          }
        });
      } catch (e) {
        console.warn('Error loading meds:', e);
      }
    }

    loadNextAppointment();
    loadMedsRhythm();
  }

  // ==========================================
  // 2. MEDICINES CONTROLLER
  // ==========================================
  if (file === 'medicines.html') {
    let pendingMedicines = [];

    // Add "+ Add Medicine" button to header if missing
    const medHeader = document.querySelector('main header, .flex.flex-col.gap-2');
    if (medHeader && !document.getElementById('openAddMedBtn')) {
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'pt-2 flex justify-start items-center';
      btnWrapper.innerHTML = `
        <button id="openAddMedBtn" class="px-5 py-2.5 rounded-xl bg-[#124C45] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>+ Add Medicine</span>
        </button>
      `;
      medHeader.appendChild(btnWrapper);
    }

    // Modal for direct medicine entry
    const medModalHtml = `
      <div id="newMedModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#EAE4E7]">
          <div class="flex items-center justify-between pb-2 border-b border-[#EAE4E7]">
            <h3 class="text-lg font-semibold text-[#29252B]">Add New Medicine</h3>
            <button id="closeMedModal" class="text-gray-400 hover:text-gray-600"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form id="newMedForm" class="flex flex-col gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Medicine Name</label>
              <input id="directMedName" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="e.g. Folic Acid 5mg" required />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Dosage</label>
                <input id="directMedDosage" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="e.g. 1 tablet (5mg)" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Time (HH:MM)</label>
                <input id="directMedTime" type="time" value="09:00" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" required />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Instructions / Notes</label>
              <input id="directMedNotes" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="e.g. Take with morning breakfast" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" id="cancelMedModal" class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#124C45] text-white text-sm font-semibold hover:opacity-95 shadow-sm">Save Medicine</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (!document.getElementById('newMedModal')) {
      document.body.insertAdjacentHTML('beforeend', medModalHtml);
    }

    const openMedBtn = document.getElementById('openAddMedBtn');
    const medModal = document.getElementById('newMedModal');
    const closeMedBtn = document.getElementById('closeMedModal');
    const cancelMedBtn = document.getElementById('cancelMedModal');
    const newMedForm = document.getElementById('newMedForm');

    if (openMedBtn && medModal) openMedBtn.onclick = () => medModal.classList.remove('hidden');
    if (closeMedBtn && medModal) closeMedBtn.onclick = () => medModal.classList.add('hidden');
    if (cancelMedBtn && medModal) cancelMedBtn.onclick = () => medModal.classList.add('hidden');

    if (newMedForm) {
      newMedForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('directMedName').value.trim();
        const dosage = document.getElementById('directMedDosage').value.trim() || 'As prescribed';
        const time = document.getElementById('directMedTime').value || '09:00';
        const notes = document.getElementById('directMedNotes').value.trim();

        try {
          await window.MamaAPI.medicines.create({
            name,
            dosage,
            times: [time],
            startDate: new Date().toISOString().split('T')[0],
            notes
          });
          toast('Medicine added successfully!');
          medModal.classList.add('hidden');
          newMedForm.reset();
          loadMedicinesList();
        } catch (err) {
          toast(err.message || 'Error adding medicine', true);
        }
      };
    }

    // Wire "Enter manually instead" button
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.includes('Enter manually instead')) {
        b.onclick = () => {
          const medModal = document.getElementById('newMedModal');
          if (medModal) medModal.classList.remove('hidden');
        };
      }
    });

    async function loadMedicinesList() {
      try {
        const data = await window.MamaAPI.medicines.get();
        const meds = data.medicines || [];
        const doses = data.doses || [];

        const verifiedContainer = document.getElementById('activeMedicinesList') || document.querySelector('div.flex.flex-col.gap-4');
        const scheduleContainer = document.getElementById('todayMedicinesScheduleList');
        const badgeEl = document.getElementById('scheduleTakenBadge');

        // Render Today's Schedule
        let takenCount = 0;
        if (scheduleContainer) {
          if (meds.length === 0) {
            scheduleContainer.innerHTML = `
              <div class="p-4 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
                No medicines scheduled for today. Add a medicine above to see your schedule.
              </div>
            `;
          } else {
            let schedHtml = '';
            meds.forEach(med => {
              const isTaken = doses.some(d => String(d.medicine) === String(med._id) && d.status === 'taken');
              if (isTaken) takenCount++;
              const timeStr = (med.times && med.times[0]) || '09:00 AM';
              schedHtml += `
                <div class="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low transition-colors border border-[#EAE4E7]">
                  <div class="flex items-center gap-3.5">
                    <div class="w-7 h-7 rounded-full ${isTaken ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center">
                      <span class="material-symbols-outlined text-[16px]">${isTaken ? 'check' : 'hourglass_top'}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-md text-body-md font-medium text-primary ${isTaken ? 'line-through opacity-70' : ''}">${med.name} (${med.dosage || 'Prescribed dose'})</span>
                      <span class="font-label-sm text-label-sm text-on-surface-variant">${timeStr} ${med.notes ? '· ' + med.notes : ''}</span>
                    </div>
                  </div>
                  <button class="sched-take-btn font-label-sm text-label-sm font-semibold px-3 py-1 rounded ${isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-[#124C45] text-white hover:opacity-90'}" data-med-id="${med._id}">
                    ${isTaken ? 'Taken ✓' : 'Mark Taken'}
                  </button>
                </div>
              `;
            });
            scheduleContainer.innerHTML = schedHtml;

            // Bind schedule take buttons
            scheduleContainer.querySelectorAll('.sched-take-btn').forEach(btn => {
              btn.onclick = async function() {
                const medId = this.dataset.medId;
                try {
                  await window.MamaAPI.medicines.logDose(medId, '09:00', 'taken');
                  toast('Dose updated!');
                  loadMedicinesList();
                } catch (e) {
                  toast(e.message, true);
                }
              };
            });
          }
        }

        if (badgeEl) {
          badgeEl.textContent = meds.length > 0 ? `${takenCount} of ${meds.length} taken` : '0 taken';
        }

        if (!verifiedContainer) return;

        if (meds.length === 0 && pendingMedicines.length === 0) {
          verifiedContainer.innerHTML = `
            <div class="bg-surface-container-lowest p-8 rounded-xl border border-dashed border-[#EAE4E7] text-center flex flex-col items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined text-[28px]">pill</span>
              </div>
              <h4 class="font-headline-sm text-primary font-semibold">No active medicines added yet</h4>
              <p class="font-body-sm text-on-surface-variant max-w-sm">Use the prescription input box above to speak or type your medicines, or add them to your daily schedule.</p>
            </div>
          `;
          return;
        }

        let html = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[20px] text-secondary">task_alt</span>
              <span class="font-headline-sm text-headline-sm text-primary font-semibold">Your current medicines (${meds.length})</span>
            </div>
            <span class="font-label-sm text-label-sm text-secondary bg-surface-container-low px-3 py-1 rounded-full">Active Care Plan</span>
          </div>
        `;

        meds.forEach(med => {
          const timesStr = (med.times || ['09:00']).join(', ');
          const isTaken = doses.some(d => String(d.medicine) === String(med._id) && d.status === 'taken');
          html += `
            <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:shadow-md border border-[#EAE4E7]">
              <div class="flex items-start gap-4 min-w-0">
                <div class="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <span class="material-symbols-outlined text-[22px]">pill</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-headline-sm text-headline-sm text-primary font-semibold">${med.name}</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-medium">${med.dosage || 'Prescribed dose'} · ${timesStr}</span>
                  </div>
                  <div class="flex items-center gap-3 mt-1 text-on-surface-variant">
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                      <span class="font-body-md text-body-md">Daily at ${timesStr}</span>
                    </div>
                    ${med.notes ? `<span>·</span><span class="font-label-sm text-label-sm">${med.notes}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button class="mark-dose-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-[#124C45] text-white hover:opacity-95'}" data-med-id="${med._id}">
                  ${isTaken ? '<span class="material-symbols-outlined text-[16px] align-middle">check</span> Taken' : 'Mark Dose Taken'}
                </button>
                <button class="delete-med-btn p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors" data-med-id="${med._id}" title="Delete medicine">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          `;
        });

        verifiedContainer.innerHTML = html;

        // Attach dose logging handlers
        verifiedContainer.querySelectorAll('.mark-dose-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const medId = this.dataset.medId;
            try {
              await window.MamaAPI.medicines.logDose(medId, '09:00', 'taken');
              toast('Marked dose as taken!');
              loadMedicinesList();
            } catch (e) {
              toast(e.message, true);
            }
          });
        });

        // Attach delete handlers
        verifiedContainer.querySelectorAll('.delete-med-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const medId = this.dataset.medId;
            try {
              await window.MamaAPI.medicines.delete(medId);
              toast('Medicine removed');
              loadMedicinesList();
            } catch (e) {
              toast(e.message, true);
            }
          });
        });

      } catch (e) {
        console.warn('Error loading medicines:', e);
      }
    }

    // Voice/Text prescription input handling
    const voicePrescBtn = document.getElementById('voicePrescBtn');
    const textPrescInput = document.getElementById('textPrescInput');
    const submitTextPresc = document.getElementById('submitTextPresc');

    let prescVoiceRecognition = null;
    let prescVoiceRecording = false;

    if (voicePrescBtn && textPrescInput) {
      voicePrescBtn.addEventListener('click', () => {
        if (prescVoiceRecording) {
          if (prescVoiceRecognition) prescVoiceRecognition.stop();
          prescVoiceRecording = false;
          voicePrescBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
          voicePrescBtn.classList.add('bg-surface-container-low', 'text-primary');
          return;
        }

        prescVoiceRecording = true;
        voicePrescBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
        voicePrescBtn.classList.remove('bg-surface-container-low', 'text-primary');

        prescVoiceRecognition = startVoiceTranscription(
          (text) => { textPrescInput.value = text; },
          (err) => {
            toast(err, true);
            prescVoiceRecording = false;
            voicePrescBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
            voicePrescBtn.classList.add('bg-surface-container-low', 'text-primary');
          },
          () => { toast('Listening... Speak your prescription details'); },
          (finalText) => {
            textPrescInput.value = finalText;
            prescVoiceRecording = false;
            voicePrescBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
            voicePrescBtn.classList.add('bg-surface-container-low', 'text-primary');
            if (finalText) toast('Prescription captured! Click "Add to review".');
          }
        );

        if (!prescVoiceRecognition) {
          prescVoiceRecording = false;
          voicePrescBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
          voicePrescBtn.classList.add('bg-surface-container-low', 'text-primary');
          toast('Voice recognition not supported in this browser. Please type your prescription.', true);
        }
      });
    }

    // Handle text prescription submission
    if (submitTextPresc && textPrescInput) {
      submitTextPresc.addEventListener('click', async () => {
        const text = textPrescInput.value.trim();
        if (!text) {
          toast('Please enter or speak your prescription details', true);
          return;
        }
        pendingMedicines = [{
          name: text.length > 50 ? text.substring(0, 50) + '...' : text,
          dosage: 'As prescribed',
          notes: text,
          times: ['09:00'],
          startDate: new Date().toISOString().split('T')[0]
        }];
        toast('Prescription details captured! Click "Confirm & add to care plan" below.');
      });
    }

    // Confirm button saves extracted medicines
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const currentText = textPrescInput ? textPrescInput.value.trim() : '';
        if (pendingMedicines.length === 0 && currentText) {
          pendingMedicines = [{
            name: currentText.length > 50 ? currentText.substring(0, 50) + '...' : currentText,
            dosage: 'As prescribed',
            notes: currentText,
            times: ['09:00'],
            startDate: new Date().toISOString().split('T')[0]
          }];
        }

        if (pendingMedicines.length > 0) {
          try {
            for (const med of pendingMedicines) {
              await window.MamaAPI.medicines.create(med);
            }
            toast('Medicines successfully added to your active routine!');
            pendingMedicines = [];
            if (textPrescInput) textPrescInput.value = '';
            loadMedicinesList();
          } catch (e) {
            toast(e.message || 'Error saving medicine', true);
          }
        } else {
          toast('Please enter a medicine name or prescription text above first!', true);
        }
      });
    }

    loadMedicinesList();
  }

  // ==========================================
  // 3. APPOINTMENTS CONTROLLER
  // ==========================================
  if (file === 'appointments.html') {
    // Add "Schedule new appointment" button to header if missing
    const apptHeader = document.querySelector('main header');
    if (apptHeader && !document.getElementById('openNewApptBtn')) {
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'pt-2 flex justify-between items-center';
      btnWrapper.innerHTML = `
        <button id="openNewApptBtn" class="px-5 py-2.5 rounded-xl bg-[#124C45] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>Schedule New Appointment</span>
        </button>
      `;
      apptHeader.appendChild(btnWrapper);
    }

    // Modal for creating appointments
    const doctorInfo = getDoctorInfo();
    const modalHtml = `
      <div id="newApptModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#EAE4E7]">
          <div class="flex items-center justify-between pb-2 border-b border-[#EAE4E7]">
            <h3 class="text-lg font-semibold text-[#29252B]">Schedule Care Visit</h3>
            <button id="closeApptModal" class="text-gray-400 hover:text-gray-600"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form id="newApptForm" class="flex flex-col gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Title</label>
              <input id="apptTitle" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="e.g. Routine Checkup" required />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Date &amp; Time</label>
                <input id="apptAt" type="datetime-local" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Clinician</label>
                <input id="apptDoctor" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="${doctorInfo.name}" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Location / Clinic</label>
              <input id="apptLocation" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="${doctorInfo.hospital || 'Clinic'}" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Clinical Notes</label>
              <textarea id="apptNotes" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#124C45]" placeholder="Blood sugar screening, ultrasound..." rows="2"></textarea>
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" id="cancelApptModal" class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#124C45] text-white text-sm font-semibold hover:opacity-95 shadow-sm">Save Appointment</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const openBtn = document.getElementById('openNewApptBtn');
    const modal = document.getElementById('newApptModal');
    const closeBtn = document.getElementById('closeApptModal');
    const cancelBtn = document.getElementById('cancelApptModal');
    const form = document.getElementById('newApptForm');

    if (openBtn && modal) openBtn.onclick = () => modal.classList.remove('hidden');
    if (closeBtn && modal) closeBtn.onclick = () => modal.classList.add('hidden');
    if (cancelBtn && modal) cancelBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('apptTitle').value.trim();
        const at = document.getElementById('apptAt').value;
        const doctorName = document.getElementById('apptDoctor').value.trim();
        const loc = document.getElementById('apptLocation').value.trim();
        const notes = document.getElementById('apptNotes').value.trim();

        try {
          await window.MamaAPI.appointments.create({
            title,
            at: new Date(at).toISOString(),
            doctorName: doctorName || undefined,
            location: loc || undefined,
            notes: notes || undefined
          });
          toast('Appointment scheduled!');
          modal.classList.add('hidden');
          form.reset();
          loadAppointments();
        } catch (err) {
          toast(err.message, true);
        }
      };
    }

    // Prep checklist management
    function getPrepTasks() {
      try {
        const stored = localStorage.getItem('mama_prep_tasks');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return [
        { id: 'prep_1', text: 'Bring latest scan reports & medical documents', sub: 'Available offline in your documents repository', checked: true },
        { id: 'prep_2', text: 'Review questions for doctor', sub: 'Saved in your visit draft / Doctor Brief', checked: true },
        { id: 'prep_3', text: 'Complete daily health check-in', sub: 'Takes ~2 mins under My Health', checked: false }
      ];
    }

    function savePrepTasks(tasks) {
      localStorage.setItem('mama_prep_tasks', JSON.stringify(tasks));
    }

    function renderPrepChecklist() {
      const container = document.getElementById('visitChecklistContainer');
      const counter = document.getElementById('checklistCounter');
      if (!container) return;

      const tasks = getPrepTasks();
      const completed = tasks.filter(t => t.checked).length;
      if (counter) counter.textContent = `${completed} of ${tasks.length} completed`;

      if (tasks.length === 0) {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
            No preparation tasks added yet. Add a task below to stay prepared for your visit.
          </div>
        `;
        return;
      }

      container.innerHTML = tasks.map((t, idx) => `
        <label class="group flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors cursor-pointer select-none border border-[#EAE4E7]">
          <div class="flex items-start gap-4 flex-1">
            <input type="checkbox" ${t.checked ? 'checked' : ''} class="prep-task-cb mt-1 w-5 h-5 rounded-lg accent-primary-container cursor-pointer" data-idx="${idx}">
            <div class="flex flex-col min-w-0">
              <span class="font-body-md text-body-md text-on-surface font-medium transition-all ${t.checked ? 'text-on-surface-variant line-through' : ''}">${t.text}</span>
              ${t.sub ? `<span class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${t.sub}</span>` : ''}
            </div>
          </div>
          <button type="button" class="delete-prep-btn text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors shrink-0" data-idx="${idx}" title="Remove task">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </label>
      `).join('');

      container.querySelectorAll('.prep-task-cb').forEach(cb => {
        cb.onchange = function() {
          const idx = parseInt(this.dataset.idx, 10);
          const current = getPrepTasks();
          if (current[idx]) {
            current[idx].checked = this.checked;
            savePrepTasks(current);
            renderPrepChecklist();
          }
        };
      });

      container.querySelectorAll('.delete-prep-btn').forEach(btn => {
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          const idx = parseInt(this.dataset.idx, 10);
          const current = getPrepTasks();
          current.splice(idx, 1);
          savePrepTasks(current);
          toast('Task removed');
          renderPrepChecklist();
        };
      });
    }

    const addPrepBtn = document.getElementById('addPrepItemBtn');
    const prepInput = document.getElementById('newPrepItemInput');
    if (addPrepBtn && prepInput) {
      const handleAddPrep = () => {
        const text = prepInput.value.trim();
        if (!text) {
          toast('Please enter a task description first', true);
          return;
        }
        const tasks = getPrepTasks();
        tasks.push({ id: 'prep_' + Date.now(), text, sub: 'Added for visit prep', checked: false });
        savePrepTasks(tasks);
        prepInput.value = '';
        toast('Preparation task added!');
        renderPrepChecklist();
      };
      addPrepBtn.onclick = handleAddPrep;
      prepInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddPrep();
        }
      };
    }

    async function loadAppointments() {
      try {
        const data = await window.MamaAPI.appointments.get();
        const appts = data.appointments || [];

        const now = new Date();
        const upcoming = appts.filter(a => new Date(a.at) >= now).sort((a, b) => new Date(a.at) - new Date(b.at));
        const past = appts.filter(a => new Date(a.at) < now).sort((a, b) => new Date(b.at) - new Date(a.at));

        const titleEl = document.getElementById('nextApptTitle');
        const docEl = document.getElementById('nextApptDoctor');
        const locEl = document.getElementById('nextApptLocation');
        const dateEl = document.getElementById('nextApptDate');
        const timeEl = document.getElementById('nextApptTime');
        const statusEl = document.getElementById('nextApptStatus');

        if (upcoming.length > 0) {
          const next = upcoming[0];
          if (titleEl) titleEl.textContent = next.title;
          if (docEl) docEl.textContent = (next.doctorName ? (next.doctorName.startsWith('Dr.') ? next.doctorName : 'Dr. ' + next.doctorName) : 'Your Doctor') + (next.notes ? ` · ${next.notes}` : '');
          if (locEl) locEl.textContent = next.location || getDoctorInfo().hospital || 'Clinic / Hospital';
          if (dateEl) dateEl.textContent = formatDate(next.at);
          if (timeEl) timeEl.textContent = formatTime(next.at);
          if (statusEl) statusEl.textContent = 'Scheduled Visit';
        } else {
          if (titleEl) titleEl.textContent = 'No Upcoming Care Visit';
          if (docEl) docEl.textContent = 'Click "Schedule New Appointment" to add your next visit';
          if (locEl) locEl.textContent = getDoctorInfo().hospital || 'Clinic / Hospital';
          if (dateEl) dateEl.textContent = '--';
          if (timeEl) timeEl.textContent = '--';
          if (statusEl) statusEl.textContent = 'Empty Schedule';
        }

        const pastContainer = document.getElementById('pastAppointmentsList');
        if (pastContainer) {
          if (past.length === 0) {
            pastContainer.innerHTML = `
              <div class="p-6 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
                No completed care visits logged yet.
              </div>
            `;
          } else {
            pastContainer.innerHTML = past.map(a => `
              <div class="relative flex items-start gap-6 group">
                <div class="w-4 h-4 rounded-full bg-secondary ring-4 ring-surface-container-lowest shrink-0 mt-1 z-10"></div>
                <div class="flex-1 bg-surface-container-low/50 hover:bg-surface-container-low p-5 rounded-xl transition-all border border-[#EAE4E7]">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-1">
                    <span class="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wide">${formatDate(a.at)} · ${formatTime(a.at)}</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant">${a.doctorName || 'Doctor'}</span>
                  </div>
                  <h4 class="font-headline-sm text-headline-sm text-primary-container mt-1">${a.title}</h4>
                  <p class="font-body-md text-body-md text-on-surface-variant mt-1">${a.notes || a.location || 'Completed visit'}</p>
                </div>
              </div>
            `).join('');
          }
        }
      } catch (e) {
        console.warn('Error loading appointments:', e);
      }
    }

    renderPrepChecklist();
    loadAppointments();
  }

  // ==========================================
  // 4. MY-HEALTH CONTROLLER (DAILY LOG & VITALS)
  // ==========================================
  if (file === 'my-health.html') {
    let currentMood = 4;
    const moodMap = { 'Calm': 5, 'Good': 4, 'Tired': 3, 'Anxious': 1, 'Uncomfortable': 2 };

    // Sensation to symptom code mapping
    const sensationMap = {
      'Backache': 'abdominal_pain',
      'Heartburn': 'vomiting_severe',
      'Mild swelling': 'swelling',
      'Leg cramps': 'calf_pain'
    };

    document.querySelectorAll('#mood-selector .mood-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const val = this.getAttribute('data-value') || 'Good';
        currentMood = moodMap[val] || 4;
      });
    });

    // Voice recording with mic button - using Web Speech API with MediaRecorder fallback
    const micBtn = document.getElementById('mic-btn');
    const noteArea = document.querySelector('textarea');
    let isRecording = false;
    let activeRecognition = null;
    let mediaRecorder = null;

    if (micBtn && noteArea) {
      micBtn.addEventListener('click', async () => {
        if (!isRecording) {
          isRecording = true;
          micBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
          micBtn.classList.remove('bg-surface-container-lowest', 'text-secondary');

          // Try Web Speech API first
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            activeRecognition = recognition;

            let finalTranscript = '';
            recognition.onresult = (event) => {
              let interim = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                  interim += event.results[i][0].transcript;
                }
              }
              noteArea.value = finalTranscript + interim;
            };
            recognition.onend = () => {
              isRecording = false;
              activeRecognition = null;
              micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
              micBtn.classList.add('bg-surface-container-lowest', 'text-secondary');
              noteArea.value = finalTranscript.trim();
              if (finalTranscript.trim()) toast('Voice note captured!');
            };
            recognition.onerror = (event) => {
              isRecording = false;
              activeRecognition = null;
              micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
              micBtn.classList.add('bg-surface-container-lowest', 'text-secondary');
              if (event.error === 'not-allowed') {
                toast('Microphone access denied. Please allow microphone in browser settings.', true);
              } else if (event.error !== 'no-speech') {
                toast('Voice recognition error. Please type your note instead.', true);
              }
            };
            recognition.start();
            toast('Recording health note... Tap mic again to finish.');
          } else {
            // Fallback: MediaRecorder + server
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaRecorder = new MediaRecorder(stream);
              const audioChunks = [];
              mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
              mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                toast('Transcribing voice note...');
                try {
                  const res = await window.MamaAPI.logs.transcribe(audioBlob);
                  if (res && res.text) {
                    noteArea.value = (noteArea.value ? noteArea.value + ' ' : '') + res.text;
                    toast('Voice note transcribed!');
                  } else {
                    toast('No speech detected. Please try again or type your note.', true);
                  }
                } catch (e) {
                  toast('Transcription service unavailable. Please type your note.', true);
                }
                isRecording = false;
                micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
                micBtn.classList.add('bg-surface-container-lowest', 'text-secondary');
              };
              mediaRecorder.start();
              toast('Recording health note... Tap mic again to finish.');
            } catch (e) {
              isRecording = false;
              micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
              micBtn.classList.add('bg-surface-container-lowest', 'text-secondary');
              toast('Microphone access denied or not supported.', true);
            }
          }
        } else {
          // Stop recording
          if (activeRecognition) {
            activeRecognition.stop();
          } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          isRecording = false;
          micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
          micBtn.classList.add('bg-surface-container-lowest', 'text-secondary');
        }
      });
    }

    // Save check-in
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const note = noteArea ? noteArea.value.trim() : '';

        // Selected sensations
        const selectedSensations = [];
        document.querySelectorAll('#sensation-chips .sensation-chip').forEach(c => {
          if (c.getAttribute('data-selected') === 'true') {
            const code = sensationMap[c.textContent.trim()];
            if (code) selectedSensations.push(code);
          }
        });

        const entry = {
          clientId: 'log-' + Date.now(),
          loggedAt: new Date().toISOString(),
          source: 'text',
          symptoms: selectedSensations,
          mood: currentMood,
          vitals: {},
          note: note || undefined
        };

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Saving sanctuary log...</span>';

        try {
          await window.MamaAPI.logs.sync([entry]);
          toast('Check-in saved and securely synchronized!');
          if (noteArea) noteArea.value = '';
          loadRecentLogs();
        } catch (e) {
          toast(e.message || 'Failed to save check-in', true);
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span>Save today\'s check-in</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>';
        }
      });
    }

    async function loadRecentLogs() {
      try {
        const data = await window.MamaAPI.logs.get();
        const logs = data.logs || [];
        const container = document.querySelector('.lg\\:col-span-4 .flex.flex-col.gap-3');
        if (container && logs.length > 0) {
          container.innerHTML = logs.slice(0, 3).map(l => `
            <div class="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1.5 transition-all hover:bg-surface-container">
              <div class="flex items-center justify-between font-label-sm text-label-sm">
                <span class="font-semibold text-primary">${formatDate(l.loggedAt)}</span>
                <span class="text-secondary font-medium">Mood: ${l.mood || 4}/5</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface">${l.symptoms && l.symptoms.length ? l.symptoms.join(', ') : 'Calm daily rhythms'}</p>
              ${l.note ? `<div class="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm truncate"><span class="material-symbols-outlined text-[14px]">graphic_eq</span><span>${l.note}</span></div>` : ''}
            </div>
          `).join('');
        }
      } catch (e) {
        console.warn('Error loading logs:', e);
      }
    }

    loadRecentLogs();
  }

  // ==========================================
  // 5. DOCTOR BRIEF CONTROLLER
  // ==========================================
  if (file === 'doctor-brief.html') {
    function renderBriefDoctor() {
      const doc = getDoctorInfo();
      const patientName = getUserName();
      const nameEl = document.getElementById('briefDoctorName');
      const hospEl = document.getElementById('briefHospitalName');
      const footerEl = document.getElementById('briefFooterText');
      const patientEl = document.getElementById('briefPatientName');

      if (patientEl && patientName) patientEl.textContent = patientName;
      if (nameEl) nameEl.textContent = doc.name ? (doc.name.startsWith('Dr.') ? doc.name : 'Dr. ' + doc.name) : 'Click "Edit Info" to add Doctor';
      if (hospEl) hospEl.textContent = doc.hospital || doc.specialty || 'Clinic / Hospital';
      if (footerEl) footerEl.textContent = `Clinical brief is compiled and ready for ${doc.name || 'your doctor visit'}`;
    }

    async function loadBriefActiveMeds() {
      const medsContainer = document.getElementById('briefActiveMedsList');
      if (!medsContainer) return;
      try {
        const res = await window.MamaAPI.medicines.get();
        const meds = res.medicines || [];
        if (meds.length === 0) {
          medsContainer.innerHTML = `
            <div class="p-4 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
              No active medicines added yet. Go to <a href="medicines.html" class="text-[#124C45] underline font-semibold">Medicines</a> to add your prescribed medicines.
            </div>
          `;
          return;
        }

        medsContainer.innerHTML = meds.map(m => `
          <div class="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#EAE4E7]">
            <div class="flex items-center gap-3.5">
              <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                <span class="material-symbols-outlined text-[20px]">medication</span>
              </div>
              <div class="flex flex-col">
                <span class="font-label-lg text-label-lg text-on-surface font-semibold">${m.name}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant">${m.dosage || 'As prescribed'} · Daily at ${(m.times || ['09:00']).join(', ')}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-auto">
              ${m.notes ? `<span class="font-label-md text-label-md text-on-surface-variant">${m.notes}</span>` : ''}
              <span class="px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-semibold">Active</span>
            </div>
          </div>
        `).join('');
      } catch (e) {
        console.warn('Brief meds error:', e);
      }
    }

    // Bind Doctor Modal
    const editBtn = document.getElementById('editDoctorBriefBtn');
    const modal = document.getElementById('doctorModal');
    const closeBtn = document.getElementById('closeDocBriefModal');
    const cancelBtn = document.getElementById('cancelDocBriefModal');
    const form = document.getElementById('doctorInfoForm');

    if (editBtn && modal) {
      editBtn.onclick = () => {
        const doc = getDoctorInfo();
        const nInput = document.getElementById('docNameInput');
        const sInput = document.getElementById('docSpecialtyInput');
        const hInput = document.getElementById('docHospitalInput');
        const pInput = document.getElementById('docPhoneInput');
        const eInput = document.getElementById('docEmailInput');

        if (nInput) nInput.value = doc.name;
        if (sInput) sInput.value = doc.specialty;
        if (hInput) hInput.value = doc.hospital;
        if (pInput) pInput.value = doc.phone;
        if (eInput) eInput.value = doc.email;

        modal.classList.remove('hidden');
      };
    }

    if (closeBtn && modal) closeBtn.onclick = () => modal.classList.add('hidden');
    if (cancelBtn && modal) cancelBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('docNameInput')?.value.trim();
        const specialty = document.getElementById('docSpecialtyInput')?.value.trim();
        const hospital = document.getElementById('docHospitalInput')?.value.trim();
        const phone = document.getElementById('docPhoneInput')?.value.trim();
        const email = document.getElementById('docEmailInput')?.value.trim();

        saveDoctorInfo({ name, specialty, hospital, phone, email });
        toast('Doctor information saved!');
        if (modal) modal.classList.add('hidden');
        renderBriefDoctor();
      };
    }

    // PDF Download via Print View
    const dlBtns = [document.getElementById('downloadPdfBtn'), document.getElementById('downloadPdfBtn2')];
    dlBtns.forEach(b => {
      if (b) {
        b.onclick = () => {
          window.print();
        };
      }
    });

    // Share EHR / Link
    const shareBtn = document.getElementById('shareEhrBtn');
    if (shareBtn) {
      shareBtn.onclick = async () => {
        try {
          const res = await window.MamaAPI.handoff.create();
          if (res && res.link && res.link.token) {
            const shareUrl = `${window.location.origin}/api/handoff/view/${res.link.token}`;
            await navigator.clipboard.writeText(shareUrl).catch(() => {});
            toast('Secure clinical review link copied to clipboard!');
          } else {
            toast('Secure clinical link generated!');
          }
        } catch (e) {
          toast(e.message, true);
        }
      };
    }

    // Discussion topics management
    function getTopics() {
      try {
        const stored = localStorage.getItem('mama_doctor_topics');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return [];
    }

    function saveTopics(topics) {
      localStorage.setItem('mama_doctor_topics', JSON.stringify(topics));
    }

    function renderDiscussionTopics() {
      const container = document.getElementById('discussionTopicsList');
      const badge = document.getElementById('topicCountBadge');
      if (!container) return;

      const topics = getTopics();
      if (badge) badge.textContent = `${topics.length} prioritized topic${topics.length === 1 ? '' : 's'}`;

      if (topics.length === 0) {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
            No discussion topics added yet. Add a question or symptom below to discuss with your doctor.
          </div>
        `;
        return;
      }

      container.innerHTML = topics.map((t, idx) => `
        <div class="p-4 rounded-xl bg-surface-container-low flex items-start justify-between gap-4 transition-colors hover:bg-surface-container border border-[#EAE4E7]">
          <div class="flex items-start gap-4 flex-1">
            <span class="w-6 h-6 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-label-sm text-label-sm font-semibold shrink-0 mt-0.5">${idx + 1}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-label-lg text-label-lg text-on-surface font-semibold">${t.title}</span>
              ${t.details ? `<p class="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">${t.details}</p>` : ''}
              <div class="flex items-center gap-2 mt-2">
                <span class="font-label-sm text-label-sm text-secondary font-medium">Added for visit</span>
              </div>
            </div>
          </div>
          <button class="delete-topic-btn text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors shrink-0" data-idx="${idx}" title="Remove topic">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      `).join('');

      container.querySelectorAll('.delete-topic-btn').forEach(btn => {
        btn.onclick = function() {
          const index = parseInt(this.dataset.idx, 10);
          const current = getTopics();
          current.splice(index, 1);
          saveTopics(current);
          toast('Topic removed');
          renderDiscussionTopics();
        };
      });
    }

    const addTopicBtn = document.getElementById('addTopicBtn');
    const newTopicInput = document.getElementById('newTopicInput');

    if (addTopicBtn && newTopicInput) {
      const handleAddTopic = () => {
        const text = newTopicInput.value.trim();
        if (!text) {
          toast('Please enter a question or topic first', true);
          return;
        }
        const topics = getTopics();
        topics.push({ title: text, details: 'Added by user for doctor discussion' });
        saveTopics(topics);
        newTopicInput.value = '';
        toast('Topic added to doctor brief!');
        renderDiscussionTopics();
      };

      addTopicBtn.onclick = handleAddTopic;
      newTopicInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddTopic();
        }
      };
    }

    renderBriefDoctor();
    loadBriefActiveMeds();
    renderDiscussionTopics();
  }

  // ==========================================
  // 6. SETTINGS CONTROLLER
  // ==========================================
  if (file === 'settings.html') {
    async function fillSettings() {
      try {
        const user = await window.MamaAPI.auth.me();
        const prof = await window.MamaAPI.profile.get();

        const nameInput = document.querySelector('input[value="Ananya Sharma"]');
        if (nameInput && user && user.name) {
          nameInput.value = user.name;
          localStorage.setItem('mama_display_name', user.name);
        }

        if (prof && prof.profile) {
          const p = prof.profile;
          if (p.doctorName) {
            const docInput = document.querySelector('input[value="Dr. Sneha Rao, MBBS, MS (OB/GYN)"]');
            if (docInput) docInput.value = p.doctorName;
            localStorage.setItem('mama_doctor_name', p.doctorName);
          }
          if (p.hospital) {
            const hospInput = document.querySelector('input[value*="Motherhood Hospital"]');
            if (hospInput) hospInput.value = p.hospital;
            localStorage.setItem('mama_hospital', p.hospital);
          }
          if (p.doctorPhone) localStorage.setItem('mama_doctor_phone', p.doctorPhone);
          if (p.doctorEmail) localStorage.setItem('mama_doctor_email', p.doctorEmail);
          if (p.currentWeek) localStorage.setItem('mama_week', p.currentWeek);
        }
      } catch (e) {
        console.warn('Error loading settings:', e);
      }
    }

    const saveBtn = document.getElementById('saveChangesBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          await window.MamaAPI.profile.update({
            stage: 'pregnant',
          });
          toast('Settings saved successfully!');
        } catch (e) {
          toast(e.message, true);
        }
      });
    }

    async function loadSettingsCareCircle() {
      const container = document.getElementById('settingsCareCircleList');
      if (!container) return;
      try {
        const res = await window.MamaAPI.circle.get();
        const members = res.members || [];
        if (members.length === 0) {
          container.innerHTML = `
            <div class="p-6 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-center">
              No care circle companions connected yet. Click "Invite Member" above to invite your partner or caregiver.
            </div>
          `;
          return;
        }

        container.innerHTML = members.map(m => `
          <div class="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#EAE4E7]">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-base">
                ${m.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="font-label-lg text-label-lg text-on-surface font-semibold">${m.name}</span>
                  <span class="px-2 py-0.5 rounded-full bg-surface-container-highest font-label-sm text-label-sm text-on-surface-variant">${m.relation || 'Caregiver'}</span>
                </div>
                <span class="font-body-sm text-body-sm text-on-surface-variant">${m.email || m.phone || 'Connected contact'}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center">
              <span class="px-2.5 py-1 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-secondary font-medium">Status: ${m.status || 'invited'}</span>
              <button class="delete-settings-member-btn text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors" data-id="${m.id}" title="Remove member">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('.delete-settings-member-btn').forEach(btn => {
          btn.onclick = async function() {
            const id = this.dataset.id;
            try {
              await window.MamaAPI.circle.delete(id);
              toast('Member removed');
              loadSettingsCareCircle();
            } catch (e) {
              toast(e.message, true);
            }
          };
        });
      } catch (e) {
        console.warn('Settings circle error:', e);
      }
    }

    const inviteBtn = document.getElementById('settingsInviteMemberBtn');
    if (inviteBtn) {
      inviteBtn.onclick = () => {
        location.href = 'support.html';
      };
    }

    fillSettings();
    loadSettingsCareCircle();
  }

  // ==========================================
  // 7. SUPPORT / CIRCLE CONTROLLER
  // ==========================================
  if (file === 'support.html') {
    async function loadSupportMembers() {
      try {
        const res = await window.MamaAPI.circle.get();
        const members = res.members || [];
        const container = document.getElementById('supportMembersList');
        const nudgeToEl = document.getElementById('nudgeToMember');
        const nudgeTextEl = document.getElementById('nudgeText');
        const spotsBadgeEl = document.getElementById('sanctuarySpotsBadge');

        const userName = getUserName();
        const firstName = userName.split(' ')[0];

        // Update sanctuary spots count
        if (spotsBadgeEl) {
          spotsBadgeEl.textContent = `${members.length} of 5 sanctuary spots connected`;
        }

        // Update nudge preview
        if (members.length > 0) {
          if (nudgeToEl) nudgeToEl.textContent = `To: ${members[0].name}`;
          if (nudgeTextEl) nudgeTextEl.textContent = `“${firstName} logged a check-in today. A gentle cup of warm water or an encouraging word for ${members[0].name.split(' ')[0]} to offer would be wonderful.”`;
        } else {
          if (nudgeToEl) nudgeToEl.textContent = `To: Support Circle Member`;
          if (nudgeTextEl) nudgeTextEl.textContent = `“${firstName} logged a check-in today. A gentle cup of warm water or an encouraging word would be wonderful.”`;
        }

        if (!container) return;

        if (members.length === 0) {
          container.innerHTML = `
            <div class="bg-surface-container-lowest p-8 rounded-xl border border-dashed border-[#EAE4E7] text-center flex flex-col items-center gap-3 col-span-2">
              <div class="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined text-[28px]">group_add</span>
              </div>
              <h4 class="font-headline-sm text-primary font-semibold">No support members connected yet</h4>
              <p class="font-body-sm text-on-surface-variant max-w-sm">Tap "Invite someone to your circle" above to invite your partner, sister, mother, or caregiver.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = members.map(m => `
          <div class="bg-surface-container-lowest rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6 border border-[#EAE4E7]">
            <div class="flex flex-col gap-5">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">
                    ${m.name.charAt(0).toUpperCase()}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">${m.name}</h3>
                      <span class="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-medium">${m.relation || 'Support Member'}</span>
                    </div>
                    <span class="font-label-md text-label-md text-on-surface-variant mt-0.5">${m.email || m.phone || 'Connected contact'}</span>
                  </div>
                </div>
                <button class="delete-member-btn text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors" data-id="${m.id}" title="Remove member">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Invited to receive gentle updates and support check-ins on your maternal journey.
              </p>
            </div>
            <div class="pt-4 flex items-center justify-between border-t border-[#EAE4E7]">
              <span class="font-label-sm text-label-sm text-on-surface-variant">Status: ${m.status || 'invited'}</span>
              <button class="test-nudge-btn px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-lg text-label-lg font-semibold transition-colors" data-name="${m.name}">
                Send test nudge
              </button>
            </div>
          </div>
        `).join('');

        // Attach delete handlers
        container.querySelectorAll('.delete-member-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            try {
              await window.MamaAPI.circle.delete(id);
              toast('Member removed from support circle');
              loadSupportMembers();
            } catch (e) {
              toast(e.message, true);
            }
          });
        });

        // Attach test nudge handlers
        container.querySelectorAll('.test-nudge-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            toast(`Test support nudge sent to ${this.dataset.name}!`);
          });
        });

      } catch (e) {
        console.warn('Error loading support members:', e);
      }
    }

    const inviteForm = document.getElementById('inviteForm');
    if (inviteForm) {
      inviteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inviteName')?.value.trim();
        const relation = document.getElementById('inviteRelation')?.value || 'Family member';
        const contact = document.getElementById('inviteContact')?.value.trim() || '';

        if (!name) {
          toast('Please enter member name', true);
          return;
        }

        try {
          await window.MamaAPI.circle.invite({
            name,
            relation,
            email: contact.includes('@') ? contact : undefined,
            phone: !contact.includes('@') ? contact : undefined,
            language: 'en',
            consent: true
          });
          toast(`Invitation generated for ${name}!`);
          if (window.closeInviteModal) window.closeInviteModal();
          inviteForm.reset();
          loadSupportMembers();
        } catch (err) {
          toast(err.message || 'Error inviting member', true);
        }
      });
    }

    loadSupportMembers();
  }

  // ==========================================
  // 8. INSIGHTS CONTROLLER
  // ==========================================
  if (file === 'insights.html') {
    // Connect "Discuss with your doctor" button to doctor contact info
    const discussBtn = document.querySelector('a[href="doctor-brief.html"]');
    if (discussBtn) {
      // Add doctor contact modal trigger
      const doctorInfo = getDoctorInfo();
      if (doctorInfo.phone || doctorInfo.email) {
        // Create contact modal
        const contactModalHtml = `
          <div id="doctorContactModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#EAE4E7]">
              <div class="flex items-center justify-between pb-2 border-b border-[#EAE4E7]">
                <h3 class="text-lg font-semibold text-[#29252B]">Contact Your Doctor</h3>
                <button id="closeDoctorModal" class="text-gray-400 hover:text-gray-600"><span class="material-symbols-outlined">close</span></button>
              </div>
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F7] border border-[#EAE4E7]">
                  <span class="material-symbols-outlined text-[#124C45]">person</span>
                  <span class="font-medium text-[#29252B]" id="modal-doc-name">${doctorInfo.name}</span>
                </div>
                ${doctorInfo.hospital ? `<div class="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F7] border border-[#EAE4E7]">
                  <span class="material-symbols-outlined text-[#124C45]">local_hospital</span>
                  <span class="text-sm text-[#29252B]" id="modal-doc-hospital">${doctorInfo.hospital}</span>
                </div>` : ''}
                ${doctorInfo.phone ? `<a href="tel:${doctorInfo.phone}" class="flex items-center gap-3 p-3 rounded-xl bg-[#F8E7EF] border border-[#F2CADD] hover:bg-[#F2CADD] transition-colors">
                  <span class="material-symbols-outlined text-[#124C45]">call</span>
                  <span class="font-medium text-[#29252B]" id="modal-doc-phone">${doctorInfo.phone}</span>
                </a>` : ''}
                ${doctorInfo.email ? `<a href="mailto:${doctorInfo.email}" class="flex items-center gap-3 p-3 rounded-xl bg-[#F8E7EF] border border-[#F2CADD] hover:bg-[#F2CADD] transition-colors">
                  <span class="material-symbols-outlined text-[#124C45]">mail</span>
                  <span class="font-medium text-[#29252B]" id="modal-doc-email">${doctorInfo.email}</span>
                </a>` : ''}
                <a href="doctor-brief.html" class="w-full py-3 rounded-xl bg-[#124C45] text-white font-medium text-sm text-center hover:bg-[#0d3833] transition-colors flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">description</span>
                  <span>Prepare Doctor Brief</span>
                </a>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', contactModalHtml);

        const doctorModal = document.getElementById('doctorContactModal');
        const closeDocModal = document.getElementById('closeDoctorModal');

        // Override the button to show modal instead
        discussBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (doctorModal) doctorModal.classList.remove('hidden');
        });

        if (closeDocModal && doctorModal) {
          closeDocModal.onclick = () => doctorModal.classList.add('hidden');
        }
        if (doctorModal) {
          doctorModal.addEventListener('click', (e) => {
            if (e.target === doctorModal) doctorModal.classList.add('hidden');
          });
        }
      }
      // If no contact info available, the link goes to doctor-brief.html as normal
    }

    // Load dynamic insights data
    async function loadInsights() {
      try {
        const [logsData, medsData] = await Promise.all([
          window.MamaAPI.logs.get().catch(() => ({ logs: [] })),
          window.MamaAPI.medicines.get().catch(() => ({ medicines: [], doses: [] }))
        ]);

        const logs = logsData.logs || [];
        const meds = medsData.medicines || [];
        const doses = medsData.doses || [];

        const heroTitle = document.getElementById('insightsHeroTitle');
        const heroText = document.getElementById('insightsHeroText');
        const adherenceCard = document.getElementById('insightsAdherenceCard');
        const timelineContainer = document.getElementById('insightsTimelineContainer');
        const countSubtitle = document.getElementById('insightsCountSubtitle');

        const userName = getUserName().split(' ')[0];

        // 1. Update Hero Banner
        if (logs.length > 0) {
          const avgMood = Math.round(logs.reduce((acc, l) => acc + (l.mood || 4), 0) / logs.length);
          const moodText = avgMood >= 4 ? 'steady & calm 🌿' : avgMood === 3 ? 'restful but tired 🌸' : 'seeking extra comfort 🤍';
          if (heroTitle) heroTitle.textContent = `${userName}'s journey is ${moodText}`;
          if (heroText) heroText.textContent = `You have recorded ${logs.length} health check-in${logs.length === 1 ? '' : 's'}. We have organized your entries chronologically starting from Day 1.`;
        } else {
          if (heroTitle) heroTitle.textContent = `${userName}'s Health Insights 🌿`;
          if (heroText) heroText.textContent = `Log your daily feelings under My Health to start seeing your personalized Day 1, Day 2... reflections!`;
        }

        // 2. Render Adherence Metrics
        if (adherenceCard) {
          const totalDoses = meds.length;
          const takenDoses = doses.filter(d => d.status === 'taken').length;
          const adhPercent = totalDoses > 0 ? Math.min(100, Math.round((takenDoses / totalDoses) * 100)) : (logs.length > 0 ? 100 : 0);

          adherenceCard.innerHTML = `
            <div class="bg-surface-container-lowest rounded-2xl p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md w-full border border-[#EAE4E7]">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <span class="material-symbols-outlined text-[26px]">medication</span>
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="font-label-lg text-label-lg text-on-surface font-semibold">Care & Routine Adherence</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">${adhPercent >= 75 ? 'On Track' : 'Active Care'}</span>
                  </div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed max-w-xl">
                    ${totalDoses > 0 ? `${totalDoses} active medicine${totalDoses === 1 ? '' : 's'} prescribed. ${takenDoses} dose${takenDoses === 1 ? '' : 's'} logged.` : `Health check-ins: ${logs.length} logged.`}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-8 md:gap-12 shrink-0">
                <div class="flex flex-col">
                  <div class="flex items-baseline gap-1.5">
                    <span class="font-display-lg text-display-lg text-primary font-semibold tracking-tight">${adhPercent}</span>
                    <span class="font-headline-sm text-headline-sm text-secondary font-medium">%</span>
                  </div>
                  <span class="font-body-sm text-body-sm text-on-surface-variant mt-1">Overall Consistency</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-baseline gap-1.5">
                    <span class="font-display-lg text-display-lg text-primary font-semibold tracking-tight">${logs.length}</span>
                  </div>
                  <span class="font-body-sm text-body-sm text-on-surface-variant mt-1">Check-ins Logged</span>
                </div>
              </div>
            </div>
          `;
        }

        // 3. Render Timeline ("What We Noticed" Day 1, Day 2...)
        if (timelineContainer) {
          if (countSubtitle) {
            countSubtitle.textContent = `Synthesized from your ${logs.length} health log${logs.length === 1 ? '' : 's'}`;
          }

          if (logs.length === 0) {
            timelineContainer.innerHTML = `
              <div class="bg-surface-container-lowest p-8 rounded-xl border border-dashed border-[#EAE4E7] text-center flex flex-col items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined text-[28px]">favorite</span>
                </div>
                <h4 class="font-headline-sm text-primary font-semibold">No health check-ins logged yet</h4>
                <p class="font-body-sm text-on-surface-variant max-w-sm">Go to <a href="my-health.html" class="text-[#124C45] underline font-semibold">My Health</a> to record your daily mood, symptoms, and feelings. Each entry will show up here as Day 1, Day 2, etc.</p>
                <a href="my-health.html" class="px-5 py-2.5 rounded-xl bg-[#124C45] text-white text-xs font-semibold hover:opacity-95 shadow-sm inline-flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                  <span>Log First Check-in</span>
                </a>
              </div>
            `;
            return;
          }

          // Sort logs chronologically ascending (earliest log = Day 1)
          const sortedLogs = [...logs].sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

          timelineContainer.innerHTML = sortedLogs.map((l, index) => {
            const dayNum = index + 1;
            const weekNum = Math.ceil(dayNum / 7);
            const dateStr = formatDate(l.loggedAt);

            const symptomsText = l.symptoms && l.symptoms.length > 0
              ? l.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')
              : 'Calm daily rhythm';

            const moodLabels = { 1: 'Anxious / Low', 2: 'Uncomfortable', 3: 'Tired', 4: 'Good / Steady', 5: 'Calm / Rested' };
            const moodDisplay = moodLabels[l.mood] || 'Checked in';

            return `
              <div class="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-surface-container-lowest/90 border border-[#EAE4E7] w-full">
                <div class="flex items-start gap-5 max-w-2xl">
                  <div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary shrink-0 font-bold text-sm">
                    Day ${dayNum}
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Day ${dayNum} · Week ${weekNum}</span>
                      <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span class="font-label-sm text-label-sm text-on-surface-variant">${dateStr}</span>
                    </div>
                    <p class="font-body-lg text-body-lg text-on-surface font-medium leading-relaxed">${symptomsText}</p>
                    ${l.note ? `<span class="font-body-sm text-body-sm text-on-surface-variant">Note: "${l.note}"</span>` : ''}
                  </div>
                </div>
                <div class="flex items-center gap-4 shrink-0 bg-surface-container-low px-5 py-4 rounded-xl self-start md:self-auto">
                  <div class="flex flex-col">
                    <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Mood Rating</span>
                    <span class="font-headline-sm text-headline-sm text-primary font-semibold">${l.mood || 4}/5 · ${moodDisplay}</span>
                  </div>
                </div>
              </div>
            `;
          }).reverse().join(''); // Reverse so newest day is at top
        }

      } catch (e) {
        console.warn('Insights load error:', e);
      }
    }

    loadInsights();
  }

})();

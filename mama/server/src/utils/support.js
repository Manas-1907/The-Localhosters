import { config } from '../config.js';
import { LogEntry } from '../models/LogEntry.js';
import { MoodCheck } from '../models/MoodCheck.js';
import { SupportMember } from '../models/SupportMember.js';
import { SupportNudge } from '../models/SupportNudge.js';
import { User } from '../models/User.js';
import { claim } from './claim.js';
import { sendMail } from './mailer.js';
import { sendToUser } from './push.js';
import { istDate } from './time.js';

const DAY = 24 * 3600 * 1000;
export const EPDS_POSSIBLE = 10; // screening cut-offs vary by study (10-13); confirm with a clinician
export const EPDS_HIGH = 13;

// Persistent low mood = low mood on 3+ different days in the last 7, or a recent mood check above the cut-off.
export async function persistentLowMood(userId, now = new Date()) {
  const lows = await LogEntry.find({ user: userId, loggedAt: { $gte: new Date(now - 7 * DAY) }, mood: { $lte: 2 } }).select('loggedAt');
  if (new Set(lows.map((l) => istDate(l.loggedAt))).size >= 3) return true;
  const last = await MoodCheck.findOne({ user: userId, takenAt: { $gte: new Date(now - 14 * DAY) } }).sort({ takenAt: -1 });
  return Boolean(last && last.total >= EPDS_POSSIBLE);
}

export const inviteLink = (token) => `${config.appUrl}/join/${token}`;
const first = (name = '') => name.trim().split(/\s+/)[0] || name;

export const inviteMail = (member, motherName) => member.language === 'hi'
  ? { subject: `${first(motherName)} आपको अपने MAMA सपोर्ट सर्कल में जोड़ना चाहती हैं`,
      text: `नमस्ते ${member.name},\n\n${first(motherName)} चाहती हैं कि आप उनके MAMA सपोर्ट सर्कल का हिस्सा बनें। यदि आप सहमत हैं, तो जब उन्हें किसी के हालचाल पूछने की ज़रूरत हो सकती है, तब आपको एक छोटा, नरम संदेश मिलेगा। उनकी सेहत की कोई जानकारी कभी साझा नहीं की जाती।\n\nस्वीकार या अस्वीकार करें: ${inviteLink(member.token)}\n` }
  : { subject: `${first(motherName)} would like you in her MAMA Support Circle`,
      text: `Hi ${member.name},\n\n${first(motherName)} would like you to be part of her MAMA Support Circle. If you agree, you will get a short, gentle message only when she may need someone to check in on her. No health details are ever shared.\n\nAccept or decline: ${inviteLink(member.token)}\n` };

const nudgeMail = (member, motherName) => member.language === 'hi'
  ? { subject: `${first(motherName)} के लिए एक कोमल हालचाल`,
      text: `नमस्ते ${member.name},\n\n${first(motherName)} ने MAMA से कहा था कि जब उन्हें सहारे की ज़रूरत हो सकती है तब आपको बताया जाए। शायद आज उन्हें एक अपनापन भरी बात या मुलाक़ात अच्छी लगेगी। उन्हें फ़ोन या संदेश करके बस पूछ लें कि वे कैसी हैं, और बिना जज किए सुनें।\n\nइस संदेश में उनकी सेहत की कोई जानकारी नहीं है। ऐसे संदेश बंद करने के लिए: ${inviteLink(member.token)}\n` }
  : { subject: `A gentle check-in for ${first(motherName)}`,
      text: `Hi ${member.name},\n\n${first(motherName)} asked MAMA to let you know when she may need some support. A kind word or a visit today could mean a lot. Call or message her, ask how she is, and listen without judging.\n\nThis message does not include any health details. To stop receiving these, use: ${inviteLink(member.token)}\n` };

// Sends a neutral check-in to active Support Circle members, at most once per cooldown window.
export async function checkAndNudge(userId, { urgent = false } = {}) {
  const reason = urgent ? 'urgent' : (await persistentLowMood(userId)) ? 'persistent_low_mood' : null;
  if (!reason) return { triggered: false, sent: 0 };

  const members = await SupportMember.find({ user: userId, status: 'active' });
  if (!members.length) return { triggered: true, sent: 0, members: 0 };

  const windowMs = (urgent ? 12 : 72) * 3600 * 1000;
  if (!(await claim(`nudge:${userId}:${reason}:${Math.floor(Date.now() / windowMs)}`))) return { triggered: true, sent: 0, members: members.length, skipped: 'cooldown' };

  const mother = await User.findById(userId).select('name language');
  const names = [];
  for (const m of members) {
    let status = 'no_contact';
    if (m.email) status = (await sendMail({ to: m.email, ...nudgeMail(m, mother.name) })).status;
    await SupportNudge.create({ user: userId, memberName: m.name, reason, status });
    if (status === 'sent') names.push(m.name);
  }
  if (names.length) {
    const hi = mother.language === 'hi';
    await sendToUser(userId, { title: 'MAMA', body: hi ? `हमने ${names.join(', ')} को एक कोमल हालचाल संदेश भेजा है। आप अकेली नहीं हैं।` : `We sent a gentle check-in to ${names.join(', ')}. You are not alone.`, url: '/circle', tag: 'nudge' });
  }
  return { triggered: true, sent: names.length, members: members.length };
}

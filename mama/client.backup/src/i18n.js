import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enExtra, hiExtra } from './locales';

const en = {
  appTagline: 'Care for you, before and after the baby arrives',
  signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
  name: 'Your name', email: 'Email', password: 'Password', passwordHint: 'At least 8 characters',
  haveAccount: 'Already have an account?', noAccount: 'New here?',
  offline: 'You are offline. Connect to the internet to continue.',
  onboardTitle: 'Tell us where you are',
  onboardLead: 'This sets your weekly guidance. You can change it later.',
  stagePregnant: 'I am pregnant', stagePostpartum: 'I have delivered',
  knowDue: 'I know my due date', knowLmp: 'I know my last period date',
  dueDate: 'Due date', lmpDate: 'First day of last period', deliveryDate: 'Delivery date',
  hospital: 'Hospital (optional)', doctor: 'Doctor (optional)', saveContinue: 'Save and continue',
  hello: 'Hello, {{name}}',
  week: 'Week {{n}}', trimester: 'Trimester {{n}}', daysToDue: '{{n}} days to your due date',
  dueSoon: 'Your due date has arrived',
  pcDay: 'Day {{n}} of 42', pcLeft: '{{n}} days left in your recovery period',
  pcDone: 'You have completed the 42-day recovery period',
  tileLog: 'How are you feeling today?', tileMeds: 'Medicines', tileAppts: 'Appointments',
  soon: 'Coming soon', editDates: 'Change dates',
  loading: 'Loading', genericError: 'Something went wrong. Please try again.',
};

const hi = {
  appTagline: 'बच्चे के आने से पहले और बाद में, आपकी देखभाल के लिए',
  signIn: 'साइन इन करें', signUp: 'खाता बनाएँ', signOut: 'साइन आउट',
  name: 'आपका नाम', email: 'ईमेल', password: 'पासवर्ड', passwordHint: 'कम से कम 8 अक्षर',
  haveAccount: 'पहले से खाता है?', noAccount: 'नए हैं?',
  offline: 'आप ऑफ़लाइन हैं। आगे बढ़ने के लिए इंटरनेट से जुड़ें।',
  onboardTitle: 'बताइए आप किस चरण में हैं',
  onboardLead: 'इससे आपका साप्ताहिक मार्गदर्शन तय होगा। आप इसे बाद में बदल सकती हैं।',
  stagePregnant: 'मैं गर्भवती हूँ', stagePostpartum: 'मेरी डिलीवरी हो चुकी है',
  knowDue: 'मुझे अपनी due date पता है', knowLmp: 'मुझे आख़िरी माहवारी की तारीख़ पता है',
  dueDate: 'संभावित प्रसव तिथि', lmpDate: 'आख़िरी माहवारी का पहला दिन', deliveryDate: 'डिलीवरी की तारीख़',
  hospital: 'अस्पताल (वैकल्पिक)', doctor: 'डॉक्टर (वैकल्पिक)', saveContinue: 'सहेजें और आगे बढ़ें',
  hello: 'नमस्ते, {{name}}',
  week: 'सप्ताह {{n}}', trimester: 'तिमाही {{n}}', daysToDue: 'प्रसव तिथि में {{n}} दिन बाक़ी',
  dueSoon: 'आपकी प्रसव तिथि आ गई है',
  pcDay: '42 में से दिन {{n}}', pcLeft: 'रिकवरी अवधि के {{n}} दिन बाक़ी',
  pcDone: 'आपने 42 दिन की रिकवरी अवधि पूरी कर ली है',
  tileLog: 'आज आप कैसा महसूस कर रही हैं?', tileMeds: 'दवाइयाँ', tileAppts: 'अपॉइंटमेंट',
  soon: 'जल्द आ रहा है', editDates: 'तारीख़ें बदलें',
  loading: 'लोड हो रहा है', genericError: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।',
};

i18n.use(initReactI18next).init({
  resources: { en: { translation: { ...en, ...enExtra } }, hi: { translation: { ...hi, ...hiExtra } } },
  lng: localStorage.getItem('mama_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (l) => {
  localStorage.setItem('mama_lang', l);
  document.documentElement.lang = l;
});

export default i18n;

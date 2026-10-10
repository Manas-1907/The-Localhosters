// Curated weekly guidance. Short, general and cautious on purpose; it works offline because nothing is fetched.
// Written for a prototype: have a clinician and a native Hindi speaker review before real-world use.
const b = (from, to, title, baby, body, food, tip) => ({ from, to, title, baby, body, food, tip });

export const PREGNANCY = [
  b(0, 8, { en: 'Weeks 1 to 8', hi: 'सप्ताह 1 से 8' },
    { en: 'Your baby\'s heart begins to beat and the brain and spine start forming.', hi: 'आपके शिशु का दिल धड़कना शुरू होता है और मस्तिष्क व रीढ़ बनने लगते हैं।' },
    { en: 'Tiredness, nausea and sore breasts are common.', hi: 'थकान, जी मिचलाना और स्तनों में दर्द आम हैं।' },
    { en: 'Take folic acid as your doctor advised. If you feel sick, eat small meals often.', hi: 'डॉक्टर की सलाह के अनुसार फ़ोलिक एसिड लें। जी मिचलाए तो थोड़ा-थोड़ा करके बार-बार खाएँ।' },
    { en: 'Book your first antenatal visit and registration if you have not yet.', hi: 'यदि अभी तक नहीं करवाया है तो पहली प्रसवपूर्व जाँच और पंजीकरण करवाएँ।' }),
  b(9, 13, { en: 'Weeks 9 to 13', hi: 'सप्ताह 9 से 13' },
    { en: 'Arms, legs, fingers and toes are formed, and the organs keep growing.', hi: 'शिशु के हाथ, पैर, उँगलियाँ बन चुकी हैं और अंग बढ़ रहे हैं।' },
    { en: 'Nausea often starts to ease by the end of this stage. Drink plenty of water.', hi: 'इस चरण के अंत तक जी मिचलाना अक्सर कम होने लगता है। भरपूर पानी पिएँ।' },
    { en: 'Add iron-rich foods such as leafy greens, dal and jaggery. Take iron and calcium tablets as prescribed.', hi: 'हरी पत्तेदार सब्ज़ियाँ, दालें और गुड़ जैसे आयरन वाले भोजन शामिल करें। आयरन और कैल्शियम की गोलियाँ डॉक्टर के कहे अनुसार लें।' },
    { en: 'Doctors usually advise an early scan and blood tests around now. Ask yours.', hi: 'इस समय डॉक्टर आमतौर पर शुरुआती स्कैन और खून की जाँच की सलाह देते हैं। अपने डॉक्टर से पूछें।' }),
  b(14, 17, { en: 'Weeks 14 to 17', hi: 'सप्ताह 14 से 17' },
    { en: 'Your baby starts making small movements and is growing quickly.', hi: 'शिशु छोटी-छोटी हरकतें करने लगता है और तेज़ी से बढ़ रहा है।' },
    { en: 'Energy often returns. Your bump may start to show.', hi: 'अक्सर ऊर्जा लौट आती है। पेट का उभार दिखना शुरू हो सकता है।' },
    { en: 'Have milk, curd or paneer for calcium.', hi: 'कैल्शियम के लिए दूध, दही या पनीर लें।' },
    { en: 'Wear loose, comfortable clothes and walk a little each day unless your doctor says otherwise.', hi: 'ढीले, आरामदायक कपड़े पहनें और रोज़ थोड़ा टहलें, यदि डॉक्टर ने मना न किया हो।' }),
  b(18, 22, { en: 'Weeks 18 to 22', hi: 'सप्ताह 18 से 22' },
    { en: 'You may start to feel gentle flutters as your baby moves.', hi: 'शिशु के हिलने पर आपको हल्की फड़फड़ाहट महसूस होना शुरू हो सकती है।' },
    { en: 'Backache and leg cramps can begin. Rest and gentle stretching can help.', hi: 'कमर दर्द और पैरों में ऐंठन शुरू हो सकती है। आराम और हल्का खिंचाव मदद करता है।' },
    { en: 'Eat a variety of vegetables, fruits, pulses and grains every day.', hi: 'रोज़ तरह-तरह की सब्ज़ियाँ, फल, दालें और अनाज खाएँ।' },
    { en: 'Ask your doctor about the mid-pregnancy scan, usually done between 18 and 22 weeks.', hi: 'डॉक्टर से मध्य-गर्भावस्था की स्कैन के बारे में पूछें (आमतौर पर 18 से 22 सप्ताह के बीच)।' }),
  b(23, 27, { en: 'Weeks 23 to 27', hi: 'सप्ताह 23 से 27' },
    { en: 'Your baby\'s hearing is developing and movements get stronger.', hi: 'शिशु की सुनने की क्षमता विकसित हो रही है और हरकतें मज़बूत होती हैं।' },
    { en: 'Feet may swell by evening. Rest with your feet up. Sudden swelling of the face or hands needs a doctor.', hi: 'शाम तक पैरों में सूजन हो सकती है। पैर ऊपर करके आराम करें। चेहरे या हाथों में अचानक सूजन हो तो डॉक्टर को दिखाएँ।' },
    { en: 'Keep taking iron and calcium as advised.', hi: 'आयरन और कैल्शियम डॉक्टर के कहे अनुसार लेते रहें।' },
    { en: 'A sugar (glucose) test is often done between 24 and 28 weeks. Ask your doctor.', hi: '24 से 28 सप्ताह के बीच अक्सर शुगर (ग्लूकोज़) की जाँच की जाती है। डॉक्टर से पूछें।' }),
  b(28, 31, { en: 'Weeks 28 to 31', hi: 'सप्ताह 28 से 31' },
    { en: 'Your baby is gaining weight and moves in a regular pattern.', hi: 'शिशु का वज़न बढ़ रहा है और उसकी हरकतों का एक नियमित ढर्रा बनने लगता है।' },
    { en: 'Breathlessness and heartburn are common as the womb grows. Small meals help.', hi: 'गर्भाशय बढ़ने से साँस फूलना और सीने में जलन आम है। थोड़ा-थोड़ा खाना मदद करता है।' },
    { en: 'Have light meals several times a day instead of a few heavy ones.', hi: 'भारी भोजन की जगह दिन में कई बार हल्का भोजन लें।' },
    { en: 'From about 28 weeks, notice your baby\'s movements every day. Tell your doctor at once if they reduce.', hi: 'लगभग 28 सप्ताह से रोज़ शिशु की हरकतों पर ध्यान दें। हरकत कम लगे तो तुरंत डॉक्टर को बताएँ।' }),
  b(32, 35, { en: 'Weeks 32 to 35', hi: 'सप्ताह 32 से 35' },
    { en: 'Your baby\'s lungs and brain keep maturing.', hi: 'शिशु के फेफड़े और मस्तिष्क परिपक्व होते जा रहे हैं।' },
    { en: 'Sleep can be harder. Lie on your side with a pillow between your knees.', hi: 'नींद मुश्किल हो सकती है। घुटनों के बीच तकिया रखकर करवट लेकर लेटें।' },
    { en: 'Drink plenty of fluids and eat fibre to avoid constipation.', hi: 'भरपूर तरल और फाइबर लें ताकि क़ब्ज़ न हो।' },
    { en: 'Pack your hospital bag and keep your papers together.', hi: 'अस्पताल का बैग और ज़रूरी काग़ज़ात तैयार रखें।' }),
  b(36, 40, { en: 'Weeks 36 to 40', hi: 'सप्ताह 36 से 40' },
    { en: 'Your baby is getting ready for birth and is usually head down.', hi: 'शिशु जन्म के लिए तैयार हो रहा है और आमतौर पर सिर नीचे की ओर होता है।' },
    { en: 'You may feel pressure low in your belly and practice contractions.', hi: 'पेट के निचले हिस्से में दबाव और अभ्यास वाले संकुचन महसूस हो सकते हैं।' },
    { en: 'Eat light, nourishing meals and drink plenty of water.', hi: 'हल्का, पौष्टिक भोजन लें और पानी भरपूर पिएँ।' },
    { en: 'Go to the hospital for regular painful contractions, your water breaking, bleeding, or less baby movement.', hi: 'नियमित दर्द भरे संकुचन, पानी की थैली फटना, रक्तस्राव या शिशु की हरकत कम होने पर तुरंत अस्पताल जाएँ।' }),
  b(41, 99, { en: 'Past your due date', hi: 'प्रसव तिथि के बाद' },
    { en: 'Your due date has passed.', hi: 'आपकी प्रसव तिथि निकल चुकी है।' },
    { en: 'Feeling impatient now is natural.', hi: 'इस समय बेचैनी होना स्वाभाविक है।' },
    { en: 'Eat light meals and drink water.', hi: 'हल्का भोजन लें और पानी पिएँ।' },
    { en: 'Stay in touch with your doctor. They will advise on checks and planning the birth.', hi: 'डॉक्टर के संपर्क में रहें। वे जाँच और प्रसव की योजना के बारे में सलाह देंगे।' }),
];

export const POSTPARTUM = [
  b(1, 3, { en: 'Days 1 to 3', hi: 'दिन 1 से 3' },
    { en: 'Feed your baby early and often. Newborns usually feed 8 to 12 times a day.', hi: 'शिशु को जल्दी-जल्दी और बार-बार दूध पिलाएँ। नवजात आमतौर पर दिन में 8 से 12 बार दूध पीते हैं।' },
    { en: 'Rest as much as you can. Bleeding after birth is normal and slowly lessens.', hi: 'जितना हो सके आराम करें। डिलीवरी के बाद रक्तस्राव सामान्य है और धीरे-धीरे कम होता है।' },
    { en: 'Drink plenty of fluids and eat regular, light meals.', hi: 'भरपूर तरल पिएँ और नियमित हल्का भोजन लें।' },
    { en: 'Mood swings and tears in the first days are common and usually pass.', hi: 'शुरुआती दिनों में मूड का बदलना और रोना आना आम है और आमतौर पर ठीक हो जाता है।' }),
  b(4, 7, { en: 'Days 4 to 7', hi: 'दिन 4 से 7' },
    { en: 'Wet and soiled nappies through the day are a good sign that your baby is feeding well.', hi: 'दिन भर गीले और गंदे डायपर इस बात का अच्छा संकेत हैं कि शिशु ठीक से दूध पी रहा है।' },
    { en: 'Keep stitches or your wound clean and dry. Walk a little each day.', hi: 'टाँकों या घाव को साफ़ और सूखा रखें। रोज़ थोड़ा चलें।' },
    { en: 'Eat protein, iron and calcium rich foods such as dal, eggs, milk, curd and green leafy vegetables.', hi: 'दाल, अंडे, दूध, दही और हरी पत्तेदार सब्ज़ियाँ जैसे प्रोटीन, आयरन और कैल्शियम वाले भोजन लें।' },
    { en: 'Baby blues usually settle within about two weeks. If sadness is staying or growing, tell someone.', hi: 'बेबी ब्लूज़ आमतौर पर लगभग दो हफ़्तों में ठीक हो जाता है। उदासी बनी रहे या बढ़े तो किसी को बताएँ।' }),
  b(8, 14, { en: 'Days 8 to 14', hi: 'दिन 8 से 14' },
    { en: 'Keep your baby\'s follow-up and vaccination visits.', hi: 'शिशु की फ़ॉलो-अप और टीकाकरण की मुलाक़ातें बनाए रखें।' },
    { en: 'Bleeding usually becomes lighter. Gentle walking is good. Avoid heavy lifting.', hi: 'रक्तस्राव आमतौर पर हल्का होता जाता है। हल्का चलना अच्छा है। भारी सामान उठाने से बचें।' },
    { en: 'Keep taking iron and calcium if your doctor advised them.', hi: 'यदि डॉक्टर ने कहा है तो आयरन और कैल्शियम लेते रहें।' },
    { en: 'If low mood lasts beyond two weeks, talk about it. You can take the mood check in MAMA.', hi: 'यदि उदास मन दो हफ़्ते से ज़्यादा रहे तो बात करें। आप MAMA में मूड जाँच कर सकती हैं।' }),
  b(15, 28, { en: 'Days 15 to 28', hi: 'दिन 15 से 28' },
    { en: 'Growth spurts can make your baby want to feed more often. This is normal.', hi: 'शिशु की तेज़ बढ़त के दिनों में वह ज़्यादा बार दूध माँग सकता है। यह सामान्य है।' },
    { en: 'Your strength returns slowly. Rest when your baby sleeps.', hi: 'आपकी ताक़त धीरे-धीरे लौटती है। शिशु के सोने पर आप भी आराम करें।' },
    { en: 'Eat on time and drink water each time you feed.', hi: 'समय पर खाएँ और हर बार दूध पिलाते समय पानी पिएँ।' },
    { en: 'Ask family to share night duties so you can sleep in longer stretches.', hi: 'परिवार से रात की ज़िम्मेदारी बाँटने को कहें ताकि आप कुछ घंटे लगातार सो सकें।' }),
  b(29, 99, { en: 'Days 29 to 42', hi: 'दिन 29 से 42' },
    { en: 'Check your baby\'s vaccination schedule with your doctor.', hi: 'शिशु का टीकाकरण कार्यक्रम डॉक्टर से मिला लें।' },
    { en: 'You are close to the end of the 42-day recovery period.', hi: 'आप 42 दिन की रिकवरी अवधि के अंत के क़रीब हैं।' },
    { en: 'Keep eating a varied diet with fruits, vegetables, pulses and grains.', hi: 'फल, सब्ज़ियाँ, दालें और अनाज वाला विविध भोजन लेती रहें।' },
    { en: 'Plan your check-up around day 42 and ask about family planning. Tell your doctor about any ongoing sadness, worry or thoughts of harm.', hi: 'लगभग 42वें दिन अपनी जाँच तय करें और परिवार नियोजन के बारे में पूछें। लगातार उदासी, चिंता या खुद को नुकसान के विचार हों तो डॉक्टर को बताएँ।' }),
];

export const WATCH = {
  pregnant: {
    en: 'Contact your doctor today for bleeding, severe headache, blurred vision, sudden swelling of the face or hands, fluid leaking, fever, or less baby movement.',
    hi: 'रक्तस्राव, तेज़ सिरदर्द, धुंधला दिखना, चेहरे या हाथों में अचानक सूजन, पानी का रिसाव, बुखार या शिशु की हरकत कम होने पर आज ही डॉक्टर से संपर्क करें।',
  },
  postpartum: {
    en: 'Get help urgently for heavy bleeding (a pad soaked in an hour), fever, severe headache, chest pain or trouble breathing, a painful swollen leg, or thoughts of harming yourself or your baby.',
    hi: 'भारी रक्तस्राव (घंटे भर में पैड भीगना), बुखार, तेज़ सिरदर्द, सीने में दर्द या साँस की तकलीफ़, पैर में दर्द और सूजन, या खुद को या शिशु को नुकसान के विचार आने पर तुरंत मदद लें।',
  },
};

export function pickInsight(progress) {
  if (!progress) return null;
  if (progress.stage === 'postpartum') {
    const day = Math.max(1, progress.postpartumDay || 1);
    return { stage: 'postpartum', band: POSTPARTUM.find((x) => day >= x.from && day <= x.to) || POSTPARTUM[POSTPARTUM.length - 1] };
  }
  const week = progress.gestationalWeek ?? 0;
  return { stage: 'pregnant', band: PREGNANCY.find((x) => week >= x.from && week <= x.to) || PREGNANCY[0] };
}

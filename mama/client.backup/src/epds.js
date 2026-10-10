// Edinburgh Postnatal Depression Scale: Cox JL, Holden JM, Sagovsky R (1987), Br J Psychiatry 150:782-786.
// Scores are listed in option order (items 3 and 5-10 are reverse scored). The Hindi text is an informal translation;
// replace it with a validated Hindi EPDS before real-world use.
const S = [0, 1, 2, 3];
const R = [3, 2, 1, 0];

export const EPDS = [
  { scores: S, q: { en: 'I have been able to laugh and see the funny side of things', hi: 'मैं हँस पाई हूँ और चीज़ों का मज़ेदार पहलू देख पाई हूँ' },
    o: { en: ['As much as I always could', 'Not quite so much now', 'Definitely not so much now', 'Not at all'], hi: ['हमेशा की तरह', 'अब उतना नहीं', 'अब निश्चित रूप से उतना नहीं', 'बिल्कुल नहीं'] } },
  { scores: S, q: { en: 'I have looked forward with enjoyment to things', hi: 'मैंने चीज़ों का आनंद लेते हुए इंतज़ार किया है' },
    o: { en: ['As much as I ever did', 'Rather less than I used to', 'Definitely less than I used to', 'Hardly at all'], hi: ['हमेशा की तरह', 'पहले से कुछ कम', 'पहले से काफ़ी कम', 'बिल्कुल नहीं के बराबर'] } },
  { scores: R, q: { en: 'I have blamed myself unnecessarily when things went wrong', hi: 'जब कुछ गलत हुआ तो मैंने बेवजह खुद को दोषी ठहराया' },
    o: { en: ['Yes, most of the time', 'Yes, some of the time', 'Not very often', 'No, never'], hi: ['हाँ, ज़्यादातर समय', 'हाँ, कभी-कभी', 'बहुत बार नहीं', 'नहीं, कभी नहीं'] } },
  { scores: S, q: { en: 'I have been anxious or worried for no good reason', hi: 'मैं बिना किसी अच्छे कारण के चिंतित या परेशान रही हूँ' },
    o: { en: ['No, not at all', 'Hardly ever', 'Yes, sometimes', 'Yes, very often'], hi: ['नहीं, बिल्कुल नहीं', 'शायद ही कभी', 'हाँ, कभी-कभी', 'हाँ, बहुत बार'] } },
  { scores: R, q: { en: 'I have felt scared or panicky for no very good reason', hi: 'मैं बिना किसी ख़ास कारण के डरी हुई या घबराई हुई रही हूँ' },
    o: { en: ['Yes, quite a lot', 'Yes, sometimes', 'No, not much', 'No, not at all'], hi: ['हाँ, काफ़ी ज़्यादा', 'हाँ, कभी-कभी', 'नहीं, ज़्यादा नहीं', 'नहीं, बिल्कुल नहीं'] } },
  { scores: R, q: { en: 'Things have been getting on top of me', hi: 'चीज़ें मुझ पर हावी होती रही हैं' },
    o: { en: ["Yes, most of the time I haven't been able to cope at all", "Yes, sometimes I haven't been coping as well as usual", 'No, most of the time I have coped quite well', 'No, I have been coping as well as ever'],
         hi: ['हाँ, ज़्यादातर समय मैं बिल्कुल सँभाल नहीं पाई', 'हाँ, कभी-कभी मैं पहले जितना अच्छा नहीं सँभाल पाई', 'नहीं, ज़्यादातर समय मैंने काफ़ी अच्छे से सँभाला', 'नहीं, मैं हमेशा की तरह सँभालती रही'] } },
  { scores: R, q: { en: 'I have been so unhappy that I have had difficulty sleeping', hi: 'मैं इतनी दुखी रही हूँ कि मुझे सोने में कठिनाई हुई' },
    o: { en: ['Yes, most of the time', 'Yes, sometimes', 'Not very often', 'No, not at all'], hi: ['हाँ, ज़्यादातर समय', 'हाँ, कभी-कभी', 'बहुत बार नहीं', 'नहीं, बिल्कुल नहीं'] } },
  { scores: R, q: { en: 'I have felt sad or miserable', hi: 'मैंने उदास या दुखी महसूस किया है' },
    o: { en: ['Yes, most of the time', 'Yes, quite often', 'Not very often', 'No, not at all'], hi: ['हाँ, ज़्यादातर समय', 'हाँ, काफ़ी बार', 'बहुत बार नहीं', 'नहीं, बिल्कुल नहीं'] } },
  { scores: R, q: { en: 'I have been so unhappy that I have been crying', hi: 'मैं इतनी दुखी रही हूँ कि रोती रही हूँ' },
    o: { en: ['Yes, most of the time', 'Yes, quite often', 'Only occasionally', 'No, never'], hi: ['हाँ, ज़्यादातर समय', 'हाँ, काफ़ी बार', 'केवल कभी-कभी', 'नहीं, कभी नहीं'] } },
  { scores: R, q: { en: 'The thought of harming myself has occurred to me', hi: 'खुद को नुकसान पहुँचाने का विचार मेरे मन में आया है' },
    o: { en: ['Yes, quite often', 'Sometimes', 'Hardly ever', 'Never'], hi: ['हाँ, काफ़ी बार', 'कभी-कभी', 'शायद ही कभी', 'कभी नहीं'] } },
];

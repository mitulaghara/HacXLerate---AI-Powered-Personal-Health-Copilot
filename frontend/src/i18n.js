import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
  en: {
    translation: {
      nav: {
        rural_health: "RURAL HEALTH",
        services: "Services",
        find_care: "Find Care",
        network: "Network",
        health_articles: "Health Articles",
        contact: "Contact",
        emergency: "Emergency",
        sos_108: "108 SOS",
        blood_donors: "Blood Donors",
        sign_in: "Sign In",
        language: "Language",
        change_language: "Change interface language",
        profile: "My Profile & Settings",
        view_credentials: "View credentials & clinic",
        dashboard: "Clinical Dashboard",
        patient_records: "Patient records & actions",
        sign_out: "Sign Out"
      },
      disclaimer: {
        machine_translation: "Note: Medical information has been translated using an AI service. Please consult a doctor for official medical advice."
      },
      errors: {
        translation_failed: "Translation service is currently unavailable. Displaying in English."
      }
    }
  },
  hi: {
    translation: {
      nav: {
        rural_health: "ग्रामीण स्वास्थ्य",
        services: "सेवाएं",
        find_care: "चिकित्सा खोजें",
        network: "अस्पताल नेटवर्क",
        health_articles: "स्वास्थ्य लेख",
        contact: "संपर्क करें",
        emergency: "आपातकालीन",
        sos_108: "108 आपातकालीन",
        blood_donors: "रक्तदाता",
        sign_in: "लॉग इन",
        language: "भाषा",
        change_language: "भाषा बदलें",
        profile: "मेरी प्रोफ़ाइल और सेटिंग्स",
        view_credentials: "क्रेडेंशियल और क्लिनिक देखें",
        dashboard: "क्लिनिकल डैशबोर्ड",
        patient_records: "मरीज़ रिकॉर्ड और कार्य",
        sign_out: "लॉग आउट"
      },
      disclaimer: {
        machine_translation: "नोट: चिकित्सा जानकारी का अनुवाद AI सेवा द्वारा किया गया है। आधिकारिक सलाह के लिए डॉक्टर से संपर्क करें।"
      },
      errors: {
        translation_failed: "अनुवाद सेवा अनुपलब्ध है। अंग्रेजी में दिखाया जा रहा है।"
      }
    }
  },
  gu: {
    translation: {
      nav: {
        rural_health: "ગ્રામીણ આરોગ્ય",
        services: "સેવાઓ",
        find_care: "સારવાર શોધો",
        network: "હોસ્પિટલ નેટવર્ક",
        health_articles: "આરોગ્ય લેખો",
        contact: "સંપર્ક કરો",
        emergency: "કટોકટી",
        sos_108: "108 ઇમરજન્સી",
        blood_donors: "રક્તદાતાઓ",
        sign_in: "સાઇન ઇન",
        language: "ભાષા",
        change_language: "ભાષા બદલો",
        profile: "મારી પ્રોફાઇલ અને સેટિંગ્સ",
        view_credentials: "વિગતો અને ક્લિનિક જુઓ",
        dashboard: "ક્લિનિકલ ડેશબોર્ડ",
        patient_records: "દર્દીઓના રેકોર્ડ્સ",
        sign_out: "સાઇન આઉટ"
      },
      disclaimer: {
        machine_translation: "નોંધ: તબીબી માહિતીનું ભાષાંતર AI દ્વારા કરવામાં આવ્યું છે. સત્તાવાર સલાહ માટે ડૉક્ટરનો સંપર્ક કરો."
      },
      errors: {
        translation_failed: "અનુવાદ સેવા અનુપલબ્ધ છે. અંગ્રેજીમાં દર્શાવાય છે."
      }
    }
  },
  mr: {
    translation: {
      nav: {
        rural_health: "ग्रामीण आरोग्य",
        services: "सेवा",
        find_care: "उपचार शोधा",
        network: "रुग्णालय नेटवर्क",
        health_articles: "आरोग्य लेख",
        contact: "संपर्क",
        emergency: "आपत्कालीन",
        sos_108: "108 आपत्कालीन",
        blood_donors: "रक्तदाते",
        sign_in: "लॉग इन",
        language: "भाषा",
        change_language: "भाषा बदला",
        profile: "माझे प्रोफाईल व सेटिंग्ज",
        view_credentials: "माहिती व क्लिनिक पहा",
        dashboard: "क्लिनिकल डॅशबोर्ड",
        patient_records: "रुग्ण नोंदी",
        sign_out: "साइन आउट"
      },
      disclaimer: {
        machine_translation: "टीप: वैद्यकीय माहितीचे भाषांतर AI सेवेद्वारे केले गेले आहे. अधिकृत सल्ल्यासाठी डॉक्टरांशी संपर्क साधा."
      },
      errors: {
        translation_failed: "भाषांतर सेवा उपलब्ध नाही. इंग्रजीमध्ये प्रदर्शित केले जात आहे."
      }
    }
  },
  ta: {
    translation: {
      nav: {
        rural_health: "கிராமப்புற சுகாதாரம்",
        services: "சேவைகள்",
        find_care: "சிகிச்சையைத் தேடுங்கள்",
        network: "மருத்துவமனை நெட்வொர்க்",
        health_articles: "சுகாதாரக் கட்டுரைகள்",
        contact: "தொடர்பு கொள்ள",
        emergency: "அவசரம்",
        sos_108: "108 அவசர சிகிச்சை",
        blood_donors: "இரத்த தானம் செய்பவர்கள்",
        sign_in: "உள்நுழையவும்",
        language: "மொழி",
        change_language: "மொழியை மாற்றவும்",
        profile: "என் சுயவிவரம் மற்றும் அமைப்புகள்",
        view_credentials: "சான்றுகள் மற்றும் கிளினிக்கைப் பார்க்கவும்",
        dashboard: "மருத்துவ டாஷ்போர்டு",
        patient_records: "நோயாளி பதிவுகள்",
        sign_out: "வெளியேறு"
      },
      disclaimer: {
        machine_translation: "குறிப்பு: மருத்துவத் தகவல் AI சேவையைப் பயன்படுத்தி மொழிபெயர்க்கப்பட்டுள்ளது."
      },
      errors: {
        translation_failed: "மொழிபெயர்ப்பு கிடைக்கவில்லை. ஆங்கிலத்தில் காட்டப்படுகிறது."
      }
    }
  },
  te: {
    translation: {
      nav: {
        rural_health: "గ్రామీణ ఆరోగ్యం",
        services: "సేవలు",
        find_care: "వైద్య సంరక్షణ కనుగొనండి",
        network: "ఆసుపత్రుల నెట్‌వర్క్",
        health_articles: "ఆరోగ్య కథనాలు",
        contact: "సంప్రదించండి",
        emergency: "అత్యవసరం",
        sos_108: "108 అత్యవసరం",
        blood_donors: "రక్తదాతలు",
        sign_in: "సైన్ ఇన్",
        language: "భాష",
        change_language: "భాషను మార్చండి",
        profile: "నా ప్రొఫైల్ మరియు సెట్టింగ్‌లు",
        view_credentials: "వివరాలు మరియు క్లినిక్ చూడండి",
        dashboard: "క్లినికల్ డ్యాష్‌బోర్డ్",
        patient_records: "రోగి రికార్డులు",
        sign_out: "సైన్ అవుట్"
      },
      disclaimer: {
        machine_translation: "గమనిక: వైద్య సమాచారం AI సేవ ద్వారా అనువదించబడింది."
      },
      errors: {
        translation_failed: "అనువాదం అందుబాటులో లేదు. ఆంగ్లంలో చూపబడుతోంది."
      }
    }
  },
  bn: {
    translation: {
      nav: {
        rural_health: "গ্রামীণ স্বাস্থ্য",
        services: "পরিষেবা",
        find_care: "চিকিৎসা খুঁজুন",
        network: "হাসপাতাল নেটওয়ার্ক",
        health_articles: "স্বাস্থ্য বিষয়ক প্রবন্ধ",
        contact: "যোগাযোগ",
        emergency: "জরুরি",
        sos_108: "১০৮ জরুরি",
        blood_donors: "রক্তদাতা",
        sign_in: "সাইন ইন",
        language: "ভাষা",
        change_language: "ভাষা পরিবর্তন করুন",
        profile: "আমার প্রোফাইল ও সেটিংস",
        view_credentials: "শংসাপত্র ও ক্লিনিক দেখুন",
        dashboard: "ক্লিনিক্যাল ড্যাশবোর্ড",
        patient_records: "রোগীর রেকর্ড",
        sign_out: "সাইন আউট"
      },
      disclaimer: {
        machine_translation: "দ্রষ্টব্য: চিকিৎসা সংক্রান্ত তথ্য AI পরিষেবা দ্বারা অনুবাদ করা হয়েছে।"
      },
      errors: {
        translation_failed: "অনুবাদ পরিষেবা অনুপলব্ধ। ইংরেজিতে প্রদর্শিত হচ্ছে।"
      }
    }
  }
};

const initialLang = localStorage.getItem('i18nextLng') || localStorage.getItem('app_language') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang.split('-')[0],
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu', 'ta', 'te', 'bn', 'mr'],
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

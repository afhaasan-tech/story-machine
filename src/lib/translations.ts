// All interface text lives here. To add a language: add a code to `Lang` in prompt.ts,
// add an entry below, and add it to LANGS (see README).
import type { Lang } from "./prompt";

export const LANGS: { code: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
];

export type Dict = {
  appName: string;
  tagline: string;
  nameLabel: string;
  namePlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  placeLabel: string;
  placeHint: string;
  placePlaceholder: string;
  chips: string[];
  lengthLabel: string;
  short: string;
  medium: string;
  modelLabel: string;
  tell: string;
  loading: string;
  another: string;
  change: string;
  copy: string;
  copied: string;
  retry: string;
  errors: Record<string, string>;
  required: string;
  langToggleLabel: string;
};

export const translations: Record<Lang, Dict> = {
  ar: {
    appName: "آلة الحكايات",
    tagline: "أخبرنا عن طفلك، وسنحكي له حكاية قبل النوم",
    nameLabel: "اسم الطفل",
    namePlaceholder: "مثال: سارة",
    subjectLabel: "حيوانه أو لعبته المفضلة",
    subjectPlaceholder: "مثال: أرنب",
    placeLabel: "مكان أو مزاج",
    placeHint: "اختياري",
    placePlaceholder: "مثال: القمر",
    chips: ["القمر", "غابة", "تحت البحر", "بين الغيوم", "بيت دافئ"],
    lengthLabel: "طول الحكاية",
    short: "قصيرة (دقيقتان)",
    medium: "متوسطة (٤ دقائق)",
    modelLabel: "النموذج",
    tell: "احكِ لي حكاية",
    loading: "ننثر غبار النجوم...",
    another: "حكاية أخرى",
    change: "غيّر الفكرة",
    copy: "نسخ الحكاية",
    copied: "تم النسخ ✓",
    retry: "حاول مرة أخرى",
    required: "يرجى كتابة اسم الطفل وحيوانه أو لعبته المفضلة.",
    langToggleLabel: "اللغة",
    errors: {
      invalid_input: "بعض الكلمات غير مناسبة. استخدم أحرفًا وأرقامًا بسيطة وبكلمات قصيرة.",
      inappropriate: "لنختر أفكارًا لطيفة وهادئة للأطفال. جرّب كلمات أخرى.",
      rate_limited: "طلبات كثيرة! خذ نفسًا عميقًا وحاول بعد دقيقة.",
      model_not_allowed: "هذا النموذج غير متاح. اختر نموذجًا آخر.",
      generation_failed: "النجوم نامت قليلًا ولم نستطع كتابة الحكاية. حاول مرة أخرى.",
      network: "يبدو أن الاتصال ضعيف. تأكد من الإنترنت وحاول مرة أخرى.",
    },
  },
  en: {
    appName: "Story Machine",
    tagline: "Tell us about your child, and we'll tell them a bedtime story",
    nameLabel: "Child's name",
    namePlaceholder: "e.g. Sara",
    subjectLabel: "Favorite animal or toy",
    subjectPlaceholder: "e.g. a bunny",
    placeLabel: "A place or mood",
    placeHint: "optional",
    placePlaceholder: "e.g. the moon",
    chips: ["the moon", "a forest", "under the sea", "the clouds", "a cozy home"],
    lengthLabel: "Story length",
    short: "Short (~2 min)",
    medium: "Medium (~4 min)",
    modelLabel: "Model",
    tell: "Tell me a story",
    loading: "Sprinkling stardust...",
    another: "Another story",
    change: "Change the spark",
    copy: "Copy story",
    copied: "Copied ✓",
    retry: "Try again",
    required: "Please enter the child's name and a favorite animal or toy.",
    langToggleLabel: "Language",
    errors: {
      invalid_input: "Some words don't look right. Please use simple letters and numbers, and keep it short.",
      inappropriate: "Let's keep it cozy and gentle for little ones. Please try different words.",
      rate_limited: "Lots of stories at once! Take a deep breath and try again in a minute.",
      model_not_allowed: "That model isn't available. Please pick another one.",
      generation_failed: "The stars dozed off and we couldn't write the story. Please try again.",
      network: "The connection seems weak. Check your internet and try again.",
    },
  },
};

/**
 * Word Order Comparison Translator - 설정 상수
 * GitHub Actions 빌드 시 sed 또는 envsubst로 GROK_API_KEY 치환 가능
 * 예: sed -i 's/PLACEHOLDER/실제키값/g' js/config.js
 */
const GROK_API_KEY = "__GROK_API_KEY__";
const GROK_MODEL = "grok-4-1-fast-reasoning";
const GROK_URL = "https://api.x.ai/v1/chat/completions";

const LANGUAGES = [
  { key: "ko", label: "Korean", labelKo: "한국어", placeholder: "한국어 문장을 입력하세요..." },
  { key: "ja", label: "Japanese", labelKo: "일본어", placeholder: "日本語の文を入力してください..." },
  { key: "en", label: "English", labelKo: "영어", placeholder: "Enter an English sentence..." },
  { key: "zh", label: "Chinese", labelKo: "中文", placeholder: "请输入中文句子..." },
];

const SHARED_COLORS = [
  "#E53935", "#FF6F00", "#F50057", "#00897B",
  "#1E88E5", "#8E24AA", "#43A047", "#6D4C41",
  "#00ACC1", "#C0CA33", "#3949AB", "#D81B60",
  "#5E35B1", "#039BE5", "#7CB342", "#F4511E",
];
const UNIQUE_COLOR = "#9E9E9E";

const STEP1_SYSTEM = `You are a professional translator. Translate the given sentence into Korean, Japanese, English, and Chinese.
Each translation must be grammatically correct, natural, and idiomatic in that language. Do NOT do word-by-word translation. Translate as a native speaker would naturally say it.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "ko": "한국어 번역",
  "ja": "日本語翻訳",
  "en": "English translation",
  "zh": "中文翻译"
}`;

const STEP2_SYSTEM = `You are a linguistic morpheme alignment analyst. You are given the SAME sentence translated into 4 languages (Korean, Japanese, English, Chinese). These are already correct, natural translations.

Your job: break each sentence into morpheme segments and align them by meaning across languages.

RULES:
1. Break each sentence into small meaningful segments (words or morpheme groups).
2. Assign a numeric group_id to segments that share the same core meaning across languages.
3. Some segments may exist in only some languages (e.g., articles "the/a" in English, particles in Korean/Japanese, measure words in Chinese). These get group_id: null — they are language-unique morphemes.
4. The segments for each language must concatenate (with spaces/no spaces as appropriate) to reconstruct the original sentence.
5. Order of segments in each language must match the original sentence word order.
6. group_id numbers should be sequential starting from 0.

EXAMPLE:
Sentences:
- ko: "제가 제일 좋아하는 게임은 유명 레이싱 게임인 '니드 포 스피드'입니다."
- en: "My favorite game is the famous racing game 'Need for Speed'."

Alignment:
- ko: [제가(0), 제일 좋아하는(1), 게임은(2), 유명(3), 레이싱(4), 게임인(2), '니드 포 스피드'(5), 입니다(null)]
- en: [My(0), favorite(1), game(2), is(null), the(null), famous(3), racing(4), game(2), 'Need for Speed'(5)]

Respond ONLY with valid JSON (no markdown):
{
  "alignments": {
    "ko": [{ "text": "제가", "group_id": 0 }, ...],
    "ja": [ ... ],
    "en": [ ... ],
    "zh": [ ... ]
  },
  "groups": [
    { "id": 0, "meaning": "I / my (subject)" },
    { "id": 1, "meaning": "favorite / most liked" },
    ...
  ]
}`;

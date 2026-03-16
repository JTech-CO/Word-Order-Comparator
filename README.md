# Word-Order-Comparator

> **한국어 · 일본어 · 영어 · 중국어 4개 언어의 어순(Word Order) 차이를 시각적으로 비교해 주는 번역기**

## 1. 소개 (Introduction)

이 프로젝트는 언어마다 다른 문장 구조와 어순을 직관적으로 이해할 수 있도록 개발된 웹 애플리케이션입니다.
하나의 문장을 입력하면 4개 언어로 자연스럽게 번역한 뒤, 의미가 대응되는 형태소끼리 같은 색상으로 하이라이트하고 연결선으로 이어 줌으로써 각 언어에서 같은 의미가 어디에 배치되는지 한눈에 파악할 수 있습니다.

**주요 기능**
- **4개 국어 자연 번역**: 입력 문장을 한국어·일본어·영어·중국어로 문법에 맞게 번역
- **형태소 정렬 시각화**: 의미 단위별 색상 하이라이트 + 언어 간 연결선으로 어순 차이를 시각화
- **언어 고유 형태소 표시**: 특정 언어에만 존재하는 형태소(관사, 조사, 어미 등)를 별도 스타일로 구분
- **호버 인터랙션**: 특정 형태소에 마우스를 올리면 4개 언어에서 대응하는 부분만 강조

**[Word Order Comparator 실행하기](https://jtech-co.github.io/Word-Order-Comparator/index.html)**

## 2. 기술 스택 (Tech Stack)

- **Frontend**: HTML, CSS, Vanilla JavaScript (단일 파일)
- **Font**: Google Fonts (Noto Sans KR / JP / SC, DM Sans)
- **AI API**: xAI Grok API (`grok-3-mini-fast-beta`)
- **Deployment**: GitHub Pages

## 3. 설치 및 실행 (Quick Start)

**요구 사항**: 웹 브라우저, xAI API 키

1. **설치 (Install)**
   ```bash
   git clone https://github.com/jtech-co/Word-Order-Comparator.git
   cd Word-Order-Comparator
   ```

2. **환경 변수 (Environment)**
   코드 내 `__GROK_API_KEY__` 플레이스홀더를 실제 API 키로 치환합니다.
   ```bash
   # 로컬 테스트 시
   sed -i 's/__GROK_API_KEY__/실제_API_키/g' index.html
   ```
   GitHub Actions를 사용하는 경우, Repository Secrets에 `GROK_API_KEY`를 등록한 뒤 워크플로우에서 치환합니다.
   ```yaml
   - name: Inject API Key
     run: sed -i 's/__GROK_API_KEY__/${{ secrets.GROK_API_KEY }}/g' index.html
   ```

3. **실행 (Run)**
   ```bash
   # 별도 빌드 없이 브라우저에서 직접 열기
   open index.html
   ```

## 4. 폴더 구조 (Structure)

```text
Word-Order-Comparator/
└── index.html    # 전체 애플리케이션 (HTML + CSS + JS 단일 파일)
```

## 5. 정보 (Info)

- **License**: MIT

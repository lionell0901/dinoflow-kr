# DinoFlow 기업 AI 실무교육 랜딩

> 기업·기관 교육 담당자가 교육 방식과 운영 근거를 확인하고 맞춤 교육을 문의하는 공식 웹사이트

[![Live Site](https://img.shields.io/badge/Site-Live-brightgreen)](https://dinoflow.kr)

## 🎯 프로젝트 소개

AI 실전 경험과 교육 설계 전문성을 바탕으로 기업·기관 맞춤 교육을 소개하는 단일 페이지 랜딩 사이트입니다.

### 주요 기능

- ✅ **반응형 디자인** - 모바일/태블릿/데스크톱 레이아웃 제공
- ✅ **증거 중심 구성** - 프로그램, 교육 현장, 누적 기록, 강사 경력을 한 흐름으로 제공
- ✅ **접근성 고려** - 시맨틱 HTML, 키보드 포커스, ARIA 상태, 모션 감소 설정 지원
- ✅ **성능 최적화** - CSS/JS 최소화, WebP 이미지와 레이지 로딩
- ✅ **문의 연결** - EmailJS 자동 접수와 이메일·카카오톡 대체 경로 제공

## 🚀 빠른 시작

### 설치

```bash
# 프로젝트 클론
git clone https://github.com/lionell0901/dinoflow-kr.git
cd dinoflow-kr

# 의존성 설치 (빌드 도구 사용 시)
npm install
```

### 개발 서버 실행

```bash
# Python 3 사용
npm run dev
# 또는
python3 -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## 🛠️ 빌드 및 배포

### 빌드 프로세스

```bash
# CSS와 JS 최소화
npm run build

# 개별 빌드
npm run minify:css  # CSS 최소화
npm run minify:js   # JS 최소화
```

### 이미지 최적화

```bash
# 이미지 백업 (원본 보존)
npm run backup:images

# 이미지 최적화 (1920px 이하로 리사이즈)
npm run optimize:images
```

### 파일 크기 확인

```bash
npm run stats
```

## 📁 프로젝트 구조

```
dinoflow-kr/
├── index.html              # 메인 랜딩 HTML
├── css/
│   ├── style.css           # 개발용 CSS
│   └── style.min.css       # 프로덕션 CSS
├── js/
│   ├── main.js             # 개발용 JavaScript
│   └── main.min.js         # 프로덕션 JS
├── images/                 # 이미지 에셋
│   ├── logo/               # 클라이언트 로고
│   └── *.jpg/jpeg/png      # 포트폴리오 이미지
├── package.json            # 프로젝트 설정 및 빌드 스크립트
├── tests/                  # Node 회귀 테스트
├── vercel.json             # Vercel 빌드·헤더 설정
└── README.md               # 프로젝트 문서
```

## 🎨 기술 스택

### Frontend
- **HTML5** - 시맨틱 마크업
- **CSS3** - CSS Variables, Flexbox, Grid
- **Vanilla JavaScript** - 순수 JavaScript (프레임워크 없음)

### 디자인 시스템
- **폰트**: Pretendard (한글), Apple SD Gothic Neo 대체
- **색상**: Forest Green, Coral, Paper 기반의 차분한 B2B 팔레트

### 빌드 도구
- **clean-css-cli**: CSS 최소화
- **terser**: JavaScript 최소화
- **sips**: 이미지 최적화 (macOS 내장)

### 배포
- **Vercel**: `main` 브랜치 기반 정적 사이트 빌드·호스팅
- **커스텀 도메인**: `dinoflow.kr`
- **빌드 명령**: `npm ci` 후 `npm run build`

## 📊 성능 최적화

### 현재 제공 방식

- 프로덕션 HTML은 `style.min.css`, `main.min.js`를 참조합니다.
- CSS/JS URL은 배포 버전 쿼리를 사용하고 장기 캐시합니다.
- 변경 가능한 이미지 파일은 짧은 캐시와 재검증 여유 시간을 사용합니다.
- 원본 강의 사진은 `.vercelignore`로 배포 대상에서 제외합니다.

### 추가 최적화 가능 항목

- [ ] **미사용 배포 이미지 정리**
- [ ] **반응형 이미지 후보 추가**
- [ ] **Service Worker**: 오프라인 지원
- [ ] **Critical CSS**: 초기 렌더링 최적화

## 📱 브라우저 지원

최신 안정 버전의 Chrome, Firefox, Safari, Edge와 주요 모바일 브라우저를 대상으로 합니다. 배포 전 `npm run verify`와 핵심 모바일·키보드 흐름을 확인합니다.

## 🔧 개발 가이드

### npm 스크립트

```bash
npm run help           # 사용 가능한 스크립트 목록
npm run build          # 프로덕션 빌드
npm run dev            # 개발 서버 실행
npm run stats          # 파일 크기 확인
npm run backup:images  # 이미지 백업
npm run optimize:images # 이미지 최적화
```

### CSS 개발

- 개발 시: `css/style.css` 수정
- 빌드 후: `css/style.min.css` 자동 생성
- HTML은 `style.min.css` 참조 (프로덕션)

### JavaScript 개발

- 개발 시: `js/main.js` 수정
- 빌드 후: `js/main.min.js` 자동 생성
- HTML은 `main.min.js` 참조 (프로덕션)

## 🐛 트러블슈팅

### 빌드 오류

```bash
# npm 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 이미지 최적화 실패

```bash
# macOS에서 sips 명령이 작동하지 않는 경우
which sips  # /usr/bin/sips 확인

# 수동 최적화
sips -Z 1920 images/your-image.jpg
```

## 👤 작성자

**디노 (Dino)**
- AI 교육 전문가
- Email: godino2895@gmail.com
- Website: [dinoflow.kr](https://dinoflow.kr)

## 🙏 감사의 말

- [Pretendard](https://github.com/orioncactus/pretendard) - 한글 폰트
- [Vercel](https://vercel.com) - 호스팅

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!

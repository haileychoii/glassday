# Glassday

Glassday는 대시보드 위젯으로 일정, 학습, 메모, 습관, 소비, 기분 기록을 관리하는 React + TypeScript 앱입니다. 같은 위젯 인스턴스를 큰 화면과 모바일 웹에서 재사용하며, 화면 스타일은 `src/styles/index.css` 한곳에서 연결합니다.

## 처음 코드를 보는 경우

화면에서 파일을 찾거나 Figma 시안을 구현하려면 이 순서로 읽어보세요.

1. [모바일 화면과 코드 지도](docs/mobile-ui-map.md): 화면 구조 그림, 각 TSX/CSS 파일의 역할, 위젯 추가 절차
2. [UI Architecture and Figma Guide](docs/UI_ARCHITECTURE_AND_FIGMA_GUIDE.md): 앱/위젯/데이터 구조와 Figma Component·Variant 연결
3. [TSX와 CSS 연결 지도](docs/CSS_STRUCTURE.md): CSS 적용 순서와 무엇을 바꿀 때 어느 파일을 열지 정리

코드 검색 시 화면 이름이나 버튼에 표시되는 문구를 먼저 `src/components`에서 찾고, 해당 요소의 `className`을 `src/styles`에서 찾으면 됩니다. 공통 제목/아이콘/간격은 개별 위젯 스타일보다 `GlassCard.tsx`와 `mobile-common.css`를 먼저 확인합니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

프로덕션 번들을 만들려면 `npm run build`, 코드 스타일 검사를 실행하려면 `npm run lint`를 사용합니다.

## 주요 폴더

| 폴더 | 역할 |
|---|---|
| `src/components/layout` | 앱 화면 껍데기, 사이드바, 모바일 헤더/하단 탭 |
| `src/components/mobile` | 모바일 대시보드 슬롯과 Calendar/Career 요약 카드 |
| `src/components/widgets` | 실제 위젯 화면과 각 기능별 하위 컴포넌트 |
| `src/components/glass` | 위젯들이 공유하는 카드 프레임 |
| `src/components/grid` | 큰 화면의 드래그/크기 변경 그리드 |
| `src/constants` | 위젯 이름, 테마, 기본 배치 등 앱 공통 목록 |
| `src/context`, `src/hooks` | 화면 사이에 공유하는 데이터와 저장/반응형 동작 |
| `src/styles` | 공통, 위젯별, 테마별, 모바일 전용 스타일 |
| `docs` | 화면 구조, 파일 연결, Figma 구현 안내 |

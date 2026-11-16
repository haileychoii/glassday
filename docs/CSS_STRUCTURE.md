# Glassday CSS 구조

## 한눈에 보기

```text
src/main.tsx
├── src/index.css                         Tailwind 기본 레이어
└── src/styles/index.css                  앱 CSS의 유일한 진입점과 import 순서
    ├── spacing-tokens.css                 공통 간격/크기 변수의 기준점
    ├── fonts.css                          폰트 등록
    ├── base.css                           공통 위젯 프레임/제목/아이콘 규칙
    ├── layout*.css, controls.css          앱 배치와 공통 컨트롤
    ├── themes/*.css                       테마별 색/표면/테마 한정 아이콘
    ├── theme-surfaces.css                 여러 테마가 공유하는 표면 토큰
    ├── widgets/*.css                      해당 위젯 내부 전용 배치
    ├── responsive.css                     화면 크기별 공통 조정
    ├── overrides.css                      기본 규칙으로 해결되지 않는 예외만
    └── mobile*.css                        모바일 전용 배치/위젯 조정
```

## 규칙을 어디에 둘까

| 바꾸려는 내용 | 수정할 파일 |
| --- | --- |
| 모든 데스크톱 위젯의 패딩, 제목/부제 크기, 아이콘 슬롯 크기 | `src/styles/spacing-tokens.css` |
| 공통 위젯 헤더/본문/제목의 구조와 기본 스타일 | `src/styles/base.css` |
| 특정 위젯 안의 고유한 폼, 목록, 카드 배치 | `src/styles/widgets/<위젯>.css` |
| 특정 테마의 색상, 표면, 글꼴, 테마 아이콘 | `src/styles/themes/<테마>.css` |
| 모바일에서만 달라지는 배치와 크기 | `src/styles/mobile*.css` |
| Tauri 또는 특정 화면에서만 필요한 최종 예외 | `src/styles/overrides.css` |

## 기본 원칙

1. 공통값은 `spacing-tokens.css`에 한 번만 정의한다.
2. 모든 위젯의 공통 프레임 규칙은 `base.css`에서 토큰을 사용한다.
3. 위젯 CSS는 위젯 내부 콘텐츠만 책임지고 프레임 공통값을 복사하지 않는다.
4. `overrides.css`는 특수 환경의 예외만 둔다. 공통 기본 스타일을 새로 선언하지 않는다.
5. 파일 import 순서는 cascade에 영향을 주므로 `src/styles/index.css`에서만 관리한다.

`src/styles.ts`는 더 이상 별도로 import되지 않는 중복 진입 파일이어서 제거했다. 실제 진입점은 `src/main.tsx`가 불러오는 `src/styles/index.css`다.

# Glassday TSX와 CSS 연결 지도

이 문서는 코드에서 화면 모양을 찾는 사람을 위한 짧은 길잡이입니다. 모바일 파일 전체 설명과 새 위젯 추가 절차는 [모바일 UI 파일 지도](mobile-ui-map.md), 앱/위젯/Figma 전체 구조는 [UI Architecture and Figma Guide](UI_ARCHITECTURE_AND_FIGMA_GUIDE.md)에 있습니다.

## 먼저 알아둘 연결

```mermaid
flowchart LR
  MAIN[src/main.tsx] --> ENTRY[src/styles/index.css]
  APP[src/App.tsx] --> SHELL[화면 레이아웃 TSX]
  APP --> RENDER[WidgetRenderer.tsx]
  RENDER --> WIDGET[위젯 TSX]
  WIDGET --> FRAME[GlassCard.tsx 공통 바깥 틀]
  WIDGET --> CLASS[className 이름]
  CLASS --> WCSS[widgets/name.css]
  CLASS --> MCSS[mobile-name.css]
  ENTRY --> WCSS
  ENTRY --> MCSS
  THEME[themes + theme-surfaces.css] --> SURFACE[색/투명도/blur token]
  SURFACE --> FRAME
  SURFACE --> WIDGET
  LAYOUT[MobileDashboard / DashboardGrid] --> SLOT[WidgetSlot]
  SLOT --> WIDGET
```

- `TSX`는 화면 요소와 동작을 만듭니다. 버튼을 누르면 무엇이 바뀌는지, 어떤 데이터를 표시할지를 담당합니다.
- `className`은 TSX 요소의 이름표입니다. CSS는 이 이름표를 선택해 색, 크기, 간격, 배치를 정합니다.
- `src/styles/index.css`는 CSS 목차이자 실제 로딩 순서입니다. 개별 TSX가 같은 CSS를 중복 import하지 않습니다.
- 테마 파일은 공통 surface token의 색/재질 값을 바꾸고, 공통 layout이나 여백은 소유하지 않습니다.

## 화면별 찾기

| 바꾸고 싶은 것 | 첫 번째로 열 파일 | 이어서 볼 파일 |
|---|---|---|
| 모바일 상단/스크롤/하단 탭 | `src/components/layout/MobileLayout.tsx` | `src/components/layout/MobileNavigation.tsx`, `src/styles/mobile.css` |
| 모바일 위젯 순서/슬롯 | `src/components/mobile/MobileDashboard.tsx` | `WidgetSlot.tsx`, `mobile-common.css` |
| 모든 위젯 제목/아이콘/바깥 여백 | `src/components/glass/GlassCard.tsx` | `src/styles/base.css`, `layout-tokens.css`, `mobile-common.css` |
| 특정 위젯의 내부 모습 | `src/components/widgets/[Name]Widget.tsx` | `src/styles/widgets/[name].css` |
| 특정 위젯의 모바일 배치 | 위젯 TSX에서 `className` 찾기 | `src/styles/mobile-[name].css`, `src/styles/index.css` |
| 테마 색/투명도/blur | `src/styles/theme-surfaces.css` | `src/styles/mobile-glass.css`, `src/styles/themes/[name].css` |
| Desktop/Laptop 그리드 | `src/components/grid/DashboardGrid.tsx` | `gridDefaults.ts`, `dashboard-grid.css`, `overrides.css` |
| 새 위젯이 선택 목록에 안 나타남 | `src/constants/widgets.ts` | `WidgetRenderer.tsx`, `DashboardGrid.tsx`, `dashboardTabs.ts` |

## 실제 import 순서

화살표 아래 순서대로 `src/styles/index.css`에서 불립니다. 같은 중요도의 규칙이 충돌하면 뒤의 파일이 이길 수 있으므로, 값을 바꾸기 전에는 같은 class를 `rg`로 검색해 중복 정의와 뒤쪽 override를 확인합니다.

```text
1. layout-tokens.css, fonts.css, base.css
   기본 변수, 폰트, 버튼/GlassCard 공통 구조
2. layout.css, layout-modes.css, controls.css, dashboard-grid.css, overlays.css, command.css
   앱 배치, 그리드, 입력 도구, 팝업
3. themes/*.css, theme-surfaces.css
   테마 선택 색과 semantic surface 변수
4. widgets/*.css
   각 위젯 내부의 기본 구성
5. responsive.css, overrides.css
   화면 크기/호환 보정
6. mobile.css, mobile-calendar/career/memo/money/timer.css
   모바일 화면과 기능별 모바일 콘텐츠
7. mobile-pixel.css, mobile-journal.css, mobile-finish.css
   Pixel Desk, Journal 배치, Mac Core/설정
8. pixel-desktop-parity.css, pink-diary.css, desktop-window.css
   테마 parity와 앱 창 표시
9. responsive-widgets.css, mobile-common.css, mobile-glass.css, pixel-widget-headers.css
   반응형 위젯, 모바일 공통 프레임, Glass 재질, Pixel 제목바
```

## 새 위젯을 추가할 때

1. Figma에서 카드/제목/본문/반복 행/빈 상태와 편집 상태를 정의합니다.
2. `src/types/workspace.ts`의 위젯 ID 규약을 확인하고 `src/constants/widgets.ts`에 표시 이름/설명을 등록합니다.
3. `src/components/widgets/[Name]Widget.tsx`에서 UI와 상호작용을 만들고, 내부 요소에 읽을 수 있는 `className`을 부여합니다.
4. `src/components/widgets/WidgetRenderer.tsx`와 `src/components/grid/DashboardGrid.tsx`에서 실제 React component 연결을 추가합니다.
5. `src/components/grid/gridDefaults.ts`와 `src/constants/dashboardTabs.ts`에 기본 크기/표시 탭을 정합니다.
6. `src/styles/widgets/[name].css`에서 내부 스타일을 만들고, 모바일 조정은 기존 모바일 CSS 책임에 맞춰 넣습니다.
7. `src/styles/index.css`에 파일을 한 번만 연결하고, Figma/코드 파일 지도를 업데이트합니다.

위젯 ID, 저장 데이터, 모바일 예외까지 포함한 자세한 단계는 [모바일 UI 파일 지도](mobile-ui-map.md)의 “새 위젯을 실제 앱에 추가할 때”를 따릅니다. 사용자가 이미 저장한 ID를 바꾸면 기존 배치와 연결이 끊길 수 있으니 ID 변경에는 migration이 필요합니다.

## CSS 우선순위와 `!important` 사용 규칙

스타일 충돌은 이 순서로 해결합니다.

1. 모든 테마에서 같은 모양이어야 하는 구조·간격은 공통 컴포넌트 또는 공통 반응형 파일 한 곳에 둡니다.
2. 테마별 차이는 테마 파일에서 토큰을 바꾸거나, 해당 테마 아래의 좁은 선택자로 색·재질처럼 필요한 값만 덮어씁니다.
3. 위젯별 차이는 위젯 CSS에 둡니다. 모바일에서도 실제 차이가 필요한 속성만 모바일 파일에서 바꿉니다.
4. 충돌은 먼저 `src/styles/index.css`의 import 순서와 선택자 범위로 해결합니다. 선택자를 불필요하게 길게 만들거나 같은 규칙을 마지막 파일에 복사하지 않습니다.
5. `!important`는 일반 규칙과 import 순서로 해결할 수 없는 외부 라이브러리의 inline 스타일 또는 브라우저 제어처럼 구체적인 이유가 있을 때만 사용하고, 같은 규칙에 이유를 주석으로 남깁니다.

### 점검 현황

2026-11-25 기준 `src/styles`의 CSS 49개 파일을 확인했습니다. 첫 검색에서 `!important`가 6,500곳이었고, 이 중 상당수는 모바일 공통 레이아웃, Retro/Pixel 스킨, 캘린더/Career의 누적 보정에 집중되어 있었습니다. 동일 선택자·동일 반응형 조건에서 반복된 선언도 발견했습니다. 전체 선언을 한 번에 삭제하면 테마와 그리드 크기별 동작이 바뀔 위험이 있어, 확인한 중복만 통합하고 나머지는 실제 우선순위 원인을 추적해 단계적으로 옮깁니다.

이번 정리에서는 공통 compact widget header의 반복 정의를 하나로 합쳤고, Journal 섹션 제목과 모바일 공통 위젯 제목의 중복 정렬 규칙을 제거했습니다. `!important` 전체 수를 줄이는 후속 정리에서는 파일별 선언을 공통 규칙·테마 예외·외부 라이브러리 보정으로 구분하고, 각각을 원래 소유 파일로 옮긴 뒤 화면 결과를 확인해야 합니다. 이 수치는 완료 기준이 아니라 추적용 기준점입니다.

# Glassday 위젯 Figma 제작 가이드

이 문서는 Glassday의 기존 위젯 규칙을 Figma 파일에 옮기고, 시안에서 구현 코드까지
같은 기준으로 연결하기 위한 작업 가이드다. 위젯을 새로 디자인할 때도 기존 공통 프레임을
복제해 사용한다. 위젯마다 제목 크기나 바깥 여백을 따로 만들지 않는다.

코드 구조와 TSX/CSS 연결표는 [UI Architecture and Figma Guide](UI_ARCHITECTURE_AND_FIGMA_GUIDE.md),
모바일 컴포넌트 파일 경로는 [모바일 UI 파일 지도](mobile-ui-map.md)를 참고한다.

## 1. 먼저 지킬 규칙

1. **공통 Widget Frame을 먼저 만든다.** 모든 위젯은 같은 바깥 간격, header, title/subtitle,
   icon slot, body 시작선을 사용한다.
2. **위젯별 시각 차이는 body 안에서 만든다.** 목록, 표, 차트, 편집기 같은 콘텐츠의 구조와
   내부 간격은 기능에 맞춰 달라도 된다. 위젯 이름을 이유로 외부 padding, 제목 크기, header
   높이를 바꾸지 않는다.
3. **Theme은 공통 프레임의 재질을 입힌다.** 배경색/이미지, 표면 투명도와 blur, 글자색,
   테두리와 그림자 같은 표현을 바꾼다. 공통 프레임의 크기와 여백은 바꾸지 않는다.
4. **모서리 모양은 테마 토큰 예외다.** 기본 테마는 둥근 모서리를 쓰고 Pixel Desk/Retro의
   사각형 표현은 radius만 테마에서 바꾼다. 이 예외가 padding이나 크기 변경으로 이어지면 안 된다.
5. **반응형은 같은 컴포넌트의 화면 모드로 만든다.** Desktop/Mobile은 같은 제목과 body 역할을
   유지하고, 화면 폭에 맞게 값과 내부 배치만 조정한다.

## 2. Figma 페이지와 레이어 구성

파일을 다음 페이지 순서로 구성하면 규격을 찾고 구현에 연결하기 쉽다.

| 페이지 | 담을 내용 |
|---|---|
| `00 · Cover` | 제품명, 날짜, 시안 상태, 기준 브랜치/커밋 |
| `01 · Foundations` | spacing, typography, radius, surface, color variables와 설명 |
| `02 · Widget Frame` | 공통 프레임, header/body 구조, 크기 측정 주석 |
| `03 · Widget Components` | 실제 위젯의 body 컴포넌트와 상태 variants |
| `04 · Themes` | 같은 위젯을 각 테마로 비교하는 표본 보드 |
| `05 · Responsive` | Desktop/Laptop과 Mobile 비교, 줄바꿈·스크롤 기준 |
| `06 · Handoff` | 선택한 프레임의 상태, 변수, 코드 파일 경로, 미결 사항 |

### 기준 프레임 이름

```text
Glassday / Desktop / 1440
Glassday / Laptop / 1080 × 720
Glassday / Mobile / 390
```

실제 Tauri 창의 표시 배율이 적용된 화면을 검토한다면 Cover나 Handoff에 사용한 배율과
창 크기를 적는다. 화면 배율은 Widget Frame의 Figma 변수값을 임의로 축소하는 근거가 아니다.

### 공통 Widget Frame 레이어

```text
Widget / Frame
├─ Header                         [공통 컴포넌트 인스턴스]
│  ├─ Title Group
│  │  ├─ Icon Slot
│  │  └─ Copy
│  │     ├─ Title
│  │     └─ Subtitle                [선택 항목]
│  └─ Actions                      [선택 항목]
└─ Body                            [위젯별 콘텐츠]
```

- Root는 세로 Auto Layout이다. 크기는 부모 그리드 셀을 채우고, 내부 padding은 0으로 둔다.
- Header는 고정된 공통 규격을 쓴다. 제목/부제목이 없는 위젯도 같은 header 슬롯 안에 둔다.
- Body는 남은 높이를 채우고, 내용이 넘칠 때 해당 body 안에서 스크롤한다.
- 액션 버튼은 header 오른쪽 정렬이다. 없는 액션 자리를 빈 사각형으로 만들지 않는다.
- icon이 없는 콘텐츠도 title 시작점을 임의로 당기지 않는다. 실제 제품에서 아이콘이 빠지는
  상태인지 확인하고, 공통 icon slot을 유지할지 결정한다.
- Figma에서 카드 root와 header의 바깥 선을 겹쳐 이중 테두리처럼 만들지 않는다.

## 3. Variables: 코드 토큰과 연결하기

Figma의 Variable 이름은 코드의 CSS custom property를 찾을 수 있게 짓는다. `Foundations`에
다음 Collections를 만들고, Figma의 Description에 코드 토큰을 그대로 적는다.

| Figma Collection | 예시 Variable | 코드 원본 | 적용 대상 |
|---|---|---|---|
| `Spacing` | `widget/outer-gap` | `--gd-widget-outer-gap` | 위젯 카드와 카드 사이 |
| `Spacing` | `widget/frame-inset-x` | `--gd-widget-pad-x` | Desktop header/body 좌우 inset |
| `Spacing` | `widget/frame-inset-y` | `--gd-widget-pad-y` | Desktop body 아래 inset |
| `Spacing` | `widget/header-pad-top` | `--gd-widget-header-pad-top` | Desktop header 위쪽 inset |
| `Spacing` | `widget/header-pad-bottom` | `--gd-widget-header-pad-bottom` | Desktop header 아래쪽 inset |
| `Spacing` | `widget/header-gap` | `--gd-widget-header-gap` | icon/title/actions 간격 |
| `Spacing` | `widget/copy-gap` | `--gd-widget-copy-gap` | 제목과 부제목 사이 |
| `Typography` | `widget/title-size` | `--gd-widget-title-size` | 모든 위젯 제목 |
| `Typography` | `widget/subtitle-size` | `--gd-widget-subtitle-size` | 모든 위젯 부제목 |
| `Typography` | `widget/section-title-size` | `--gd-section-title-size` | body 안의 섹션 제목 |
| `Size` | `widget/icon-slot` | `--gd-widget-header-icon-size` | 공통 icon slot |
| `Radius` | `surface/widget` | `--gd-radius-widget` | 바깥 위젯 모서리 |
| `Radius` | `surface/card` | `--gd-radius-card` | body 안의 카드/행 |
| `Radius` | `control/default` | `--gd-radius-button` | 버튼/입력 컨트롤 |
| `Color` | `surface/widget` | `--gd-widget-frame-bg`, `--gd-surface-bg` | 위젯 바탕 |
| `Color` | `surface/header` | `--gd-widget-header-bg`, `--gd-widget-header-color` | 제목 영역 표면 |
| `Color` | `border/widget` | `--gd-widget-header-border`, theme border token | 위젯/제목선 |
| `Effect` | `shadow/widget` | `--gd-widget-panel-shadow` 및 theme shadow token | 표면 그림자 |

`spacing-tokens.css`가 간격·desktop typography의 원본이고, `base.css`가 기본 컴포넌트에
연결하며, `widget-system.css`가 모든 Desktop/Tauri 위젯 프레임에 최종 적용한다. 모바일 값은
`mobile-common.css`가 같은 프레임을 모바일 화면에 맞춘다. 카드 사이 간격은 CSS margin이
아니라 `DashboardGrid.tsx`의 React Grid Layout `margin` 값으로 들어가므로
`--gd-widget-outer-gap`을 수정한다.

### 현재 코드 값 읽기

값은 viewport에 따라 `clamp()`로 변할 수 있다. Figma에서는 기준 viewport의 측정값을 기록하고,
코드 범위도 Description에 함께 적는다. 아래는 현재 토큰의 기준 범위다.

| 규칙 | Desktop / Laptop | Mobile |
|---|---:|---:|
| 카드와 카드 사이 | `--gd-widget-outer-gap`: 12px | `--mobile-widget-gap`: 8px |
| Header/body 좌우 inset | `clamp(12px, 0.85vw, 16px)` | `clamp(12px, 3vw, 16px)` |
| Header 위·아래 padding | 각각 `clamp(8px, 0.55vw, 12px)` | 각각 `clamp(8px, 2.1vw, 10px)` |
| 위젯 제목 | `clamp(12px, 0.78vw, 14px)` | `clamp(14px, 3.7vw, 16px)` |
| 위젯 부제목 | `clamp(10px, 0.58vw, 12px)` | `clamp(11px, 3vw, 12px)` |
| 아이콘 슬롯 | `clamp(24px, 1.4vw, 28px)` | `clamp(22px, 6vw, 26px)` |
| 모바일 header 액션 터치 영역 | 공통 컨트롤 규격 | `clamp(44px, 11vw, 48px)` |
| 위젯 모서리 | 기본 20px | 기본 20px |
| 안쪽 카드 모서리 | 기본 12px | 기본 12px |
| 버튼 모서리 | 기본 8px | 기본 8px |

Mobile header 높이는 고정 숫자를 별도로 맞추지 않는다. 현재 코드에서는 icon 슬롯/액션 터치
영역 중 더 큰 크기에 위아래 padding을 더해 계산한다. Pixel Desk는 widget/card/control radius를
0으로 두어 사각형을 유지한다. 이 radius만 테마 모양 예외다.

Spacing의 primitive는 `--gd-ratio-unit: 4px`을 기준으로 한다. 4px 단위는 반복 간격을 정하는
기준이며, `clamp()`가 걸린 frame 값의 실제 결과를 4의 배수로 반올림한다는 뜻은 아니다.

### Variable Modes

테마별로 spacing/typography collection을 복제하지 않는다. 공통 Spacing/Size/Typography 값을
하나로 두고, Theme mode에서는 `Color`, `Effect`, 그리고 Pixel Desk 같은 사각 테마의 `Radius`만
전환한다.

권장 모드 이름:

```text
Theme: Pastel · Glass Light · Glass Dark · Aurora · Mac Core · Pixel Desk · Retro Pink
Viewport: Desktop · Laptop · Mobile
```

Figma가 Collection당 하나의 mode 축만 표현하기 어렵다면 theme와 viewport를 별도 collection으로
만들되, 동일한 CSS 변수를 가리키는 중복 spacing 값을 여러 곳에서 수동 관리하지 않는다.

## 4. 테마 보드 만들기

`04 · Themes` 페이지에서는 같은 위젯, 같은 크기, 같은 콘텐츠를 복제하고 Theme mode만 바꾼다.
색상과 표면 차이만 비교할 수 있도록 title/body 문구와 리스트 수, 액션 개수를 고정한다.

| 테마 | Figma에서 보여줄 재질 | 바꿔도 되는 표현 |
|---|---|---|
| Pastel | 부드러운 색의 반투명 표면 | 배경, 위젯 표면, 글자색, border, shadow |
| Glass Light | 밝은 배경 위 반투명 frosted glass | 배경 이미지, surface opacity/blur, 글자색, border, shadow |
| Glass Dark | 어두운 배경 위 반투명 frosted glass | 배경 이미지, surface opacity/blur, 글자색, border, shadow |
| Aurora | 컬러가 번지는 배경과 유리 표면 | 배경, surface tint/opacity/blur, 글자색, border, shadow |
| Mac Core | 절제된 밝은 표면과 얇은 경계 | 표면색, 배경 재질, 글자색, border, shadow, 테마 아이콘 표현 |
| Pixel Desk | Windows 95의 각진 창과 bevel | palette, border/bevel, shadow, **radius 0** |
| Retro Pink | 핑크 레트로 창 표면 | 핑크 palette, 배경, border, shadow, **사각 radius** |

Glass 계열의 유리 효과는 위젯 배경 이미지/색이 뒤에서 비치고, 위젯 표면의 반투명도와 blur로
만든다. 각 body 자식에 별도 불투명 배경을 칠해 유리 표면을 가리지 않는다. Pixel/Retro의
모서리와 bevel은 표면 표현이며, header 높이·title 크기·padding을 바꿀 이유가 아니다.

테마 비교 보드 아래에는 `Shared frame` overlay를 하나 두어 모든 테마의 header/body 시작선과
외곽 크기가 같은지 확인한다. 같은 화면 크기에서 테마를 바꿨을 때 그 overlay가 밀리면 안 된다.

## 5. Component와 Variant 규칙

Figma component는 공통 프레임과 실제 콘텐츠 역할을 분리한다.

```text
Widget / Frame                       (공통 component)
Widget / Header                      (공통 component)
Widget / Header Action               (공통 component)
Widget / Section Heading             (공통 body component)
Widget / [Feature Name] / [Content]  (위젯 내부 component)
```

- 모든 위젯 화면은 `Widget / Frame`을 사용한다. 독립 구조가 필요한 Calendar/Career 모바일
  카드도 같은 제목 타입, inset, radius token을 쓰는 Frame variant로 표현한다.
- Variant property는 실제 UI 상태를 설명한다. 예: `Viewport=Desktop|Mobile`,
  `State=Default|Empty|Loading|Editing`, `Theme=Glass Light|Pixel Desk`.
- Theme별 component를 복사해 색을 각각 고정하지 않는다. 가능하면 같은 component instance에서
  Variable mode를 변경한다.
- `Widget / Frame` variant에 `Widget=Calendar`처럼 기능 이름을 추가해 padding을 변경하지 않는다.
- 위젯 콘텐츠의 행·차트·에디터는 해당 위젯 내부 component로 만든다. 내부 콘텐츠의 간격은
  실제 콘텐츠 구조에 맞게 설계할 수 있지만 공통 frame padding을 다시 더하지 않는다.
- Empty/Loading/Editing 같은 상태는 이름만 만들지 말고 실제 표시되는 내용을 그린다.

## 6. 반응형과 Figma 크기 측정

Figma Desktop/Laptop/Mobile 프레임을 만들 때, 각 프레임의 Widget Frame을 같은 component instance로
배치한다. Desktop과 Mobile은 variable mode 또는 명시된 responsive 값으로 전환한다.

- 배포 Web URL은 세로형 phone viewport에서만 별도 MobileLayout을 보여 준다. 같은 기기를
  가로로 돌리면 Laptop/Wide와 같은 가로형 AppShell을 사용하므로 Figma에서도 `Mobile / Portrait`
  와 `Mobile / Landscape → AppShell` 프레임을 구분한다.

- Desktop/Laptop에서 header/body 공통 padding은 root frame가 아니라 token에서 온다.
- Dashboard grid의 셀 간격은 12px이며 `DashboardGrid.tsx`가 같은 token을 읽는다.
- Mobile의 위젯 간격은 8px이고, 화면 좌우 gutter는 공통 `--mobile-page-gutter`다.
- Mobile header는 액션 터치 영역에 맞춰 높이가 계산되므로 title baseline을 별도로 옮기지 않는다.
- 본문은 가용 높이를 채운다. 목록·차트 등 실제 콘텐츠가 넘치는 부분만 내부 스크롤 영역으로
  표시한다. 전체 앱 스크롤과 위젯 내부 스크롤을 동시에 임의로 만들지 않는다.
- 기준 프레임에 폭을 적고, 좁은 폭에서 title/action이 겹치거나 subtitle이 잘리는지 별도로
  확인한다.

## 7. Figma에서 코드로 전달하기

선택한 Figma Frame을 전달할 때 아래 handoff 정보를 함께 적는다.

```text
Feature: (예: Habit Tracker)
Figma frame: (페이지 / 프레임 이름)
Theme mode: (예: Glass Dark)
Viewport: (예: Laptop, 1080 × 720)
Component state: (예: Default, Empty, Editing)
Shared frame: Widget / Frame 인스턴스
Content components: (이름 목록)
Data / interaction: (클릭·편집·스크롤 동작)
Code files: [TSX 경로] · [feature CSS 경로]
Open decisions: (없으면 None)
```

코드로 옮길 때의 연결 순서:

1. 공통 frame과 기존 위젯의 header/body 구조를 확인한다: `src/components/glass/GlassCard.tsx`.
2. 위젯 데이터 ID와 기본 크기를 registry에서 확인한다: `src/constants/widgets.ts`.
3. Figma layer 역할을 TSX 구조로 만든다. 각 body component에 읽을 수 있는 className을 둔다.
4. 새 위젯의 body 내부 스타일만 `src/styles/widgets/[name].css`에 추가한다.
5. 색·표면·border·shadow·테마 모양은 기존 theme token을 연결한다. 공통 frame spacing을
   widget CSS나 theme CSS에 복사하지 않는다.
6. Desktop/Laptop과 Mobile에서 같은 frame에 연결되는지 확인한다. 레이아웃이 다른 경우에도
   모바일 공통 스타일은 `src/styles/mobile-common.css`를 우선 확인한다.
7. 새 위젯이면 `DashboardGrid` renderer/map, registry, default layout 및 필요한 문서를 갱신한다.

### 바꾸려는 항목별 시작 위치

| 바꾸려는 항목 | 수정 시작 위치 |
|---|---|
| 위젯 사이 간격 | `src/styles/spacing-tokens.css`의 `--gd-widget-outer-gap` → `DashboardGrid.tsx` |
| Desktop header/body inset, 제목·부제목·아이콘 규격 | `spacing-tokens.css` → `base.css` → `widget-system.css` |
| Mobile 공통 frame, title, icon, touch target | `src/styles/mobile-common.css` |
| 모든 테마의 widget/header 표면 색·재질 | `theme-surfaces.css`, `widget-frame-theme.css`, `themes/*.css` |
| Pixel/Retro 각진 모서리 | `themes/pixel.css`, `themes/pixel-95css.css`, `themes/retro.css`의 radius 토큰 |
| 특정 위젯의 body 내부 콘텐츠 | `src/components/widgets/[Name]Widget.tsx`, `src/styles/widgets/[name].css` |
| CSS 적용 순서 | `src/styles/index.css` |

## 8. 시안 검토 체크리스트

- [ ] 모든 위젯이 같은 공통 Frame/Header를 사용한다.
- [ ] 카드 외부 gap, frame inset, title/subtitle 크기가 위젯마다 다르지 않다.
- [ ] 새 위젯 CSS에서 frame 자체의 `padding`, header 크기, 제목 크기를 재선언하지 않았다.
- [ ] Theme variant를 바꿔도 프레임 크기와 콘텐츠 시작선이 움직이지 않는다.
- [ ] Pixel Desk/Retro는 radius만 사각형이고 크기·간격은 공통이다.
- [ ] Glass 계열은 배경이 보이고 widget surface가 비치며 blur 처리된다.
- [ ] Desktop, Laptop, Mobile에서 title/action 겹침, 긴 이름, 긴 subtitle을 확인했다.
- [ ] body 안의 스크롤은 넘치는 콘텐츠에만 있고 frame 전체 높이를 밀지 않는다.
- [ ] Figma variable Description에 연결할 CSS token 또는 코드 파일 경로가 적혀 있다.
- [ ] 화면 상태 이름이 실제 TSX 상태·상호작용과 연결되어 있다.

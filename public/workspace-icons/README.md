# 아이콘 선택기 폴더

선택기 분류 탭과 같은 아이콘 파일이 아래 폴더에 한 개씩 들어 있습니다.

| 선택기 탭 | 폴더 | 파일 이름 |
| --- | --- | --- |
| 일러스트 | `illustration/` | `001.webp`, `002.webp`, ... |
| 픽셀 | `pixel/` | `retro-001.webp` 또는 `pink-094.webp` |
| 폴더·패턴 | `folder-pattern/` | `001.webp`, `002.webp`, ... |
| 표정·손 | `expressions-hands/` | `001.webp`, `002.webp`, ... |
| 사람·동물 | `people-animals/` | `001.webp`, `002.webp`, ... |
| 자연·음식 | `nature-food/` | `001.webp`, `002.webp`, ... |
| 음식·이동 | `food-travel/` | `001.webp`, `002.webp`, ... |
| 생활·기호 | `lifestyle-symbols/` | `001.webp`, `002.webp`, ... |
| 기본 선 | `basic-line/` | `home.svg`, `career.svg`, `study.svg`, `memo.svg`, `life.svg` |

픽셀 탭의 `retro-` 파일은 원래 픽셀 아이콘이고, `pink-` 파일은 일러스트 묶음에서
픽셀 아이콘으로 옮긴 파일입니다. 기존 탭 설정이 참조하는 주소를 유지하기 위해
원본 묶음 폴더(`pink-iphone/`, `retro-pixel/`, `emoji-*`, `folder-art/`)도 남겨 두었습니다.

각 폴더의 파일 목록은 `scripts/generate-workspace-icon-manifest.mjs`가 읽어 선택기
목록으로 만듭니다. 따라서 아이콘 파일을 다른 분류 폴더로 옮기거나 새 파일을 넣으면
다음 개발 서버 시작 또는 Production 빌드부터 해당 폴더의 탭에 표시됩니다. 실행 중인
개발 서버는 폴더 변경을 바로 감지하지 않으므로 재시작하고, Production에서는 변경을
커밋해 다시 배포해야 합니다.

기존 선택기 항목의 이름과 순서는 `src/constants/workspaceIconChoices.ts`에 남아 있어
그 항목을 옮겨도 표시 이름은 유지됩니다. 새 파일은 파일 이름을 바탕으로 임시 이름을
만들어 표시합니다. 그림 의미에 따른 일러스트의 세부 순서는 자동 판정하지 않으므로
원하는 위치로 옮긴 뒤 필요하면 그 파일의 표시 이름과 정렬을 코드에서 다듬을 수 있습니다.

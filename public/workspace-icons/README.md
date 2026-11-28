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

파일 번호는 선택기와 저장된 탭 아이콘 주소를 연결하므로 직접 이동하거나 이름을
바꿀 때는 `src/constants/workspaceIconChoices.ts`와 `src/constants/workspaceIconPaths.ts`도
함께 맞춰야 합니다. 이 폴더 구성은 현재 선택기에 노출되는 아이콘을 탭별로 모아 둔
것이며, 그림의 의미를 새로 판정해 분류하지는 않았습니다.

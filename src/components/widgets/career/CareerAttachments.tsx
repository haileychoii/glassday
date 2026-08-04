/**
 * [Inactive Career Prototype] Attachment editor component
 * 현재 src 내부에서 import되지 않으며 실제 Career detail은 CareerWidget.tsx의 inline UI와
 * src/types/dashboard.ts를 사용한다. 이 파일은 careerTypes/careerUtils 기반의 이전 분리안이다.
 * Figma 참고 시 Attachment List Component 후보로만 보고 현재 렌더 tree에 포함하지 않는다.
 */
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import type {
  CareerAttachment,
  CareerAttachmentType,
  CareerItem,
} from "./careerTypes";
import {
  attachmentTypeLabels,
  createCareerAttachment,
} from "./careerUtils";

type CareerAttachmentsProps = {
  item: CareerItem;
  onChange: (patch: Partial<CareerItem>) => void;
};

const attachmentTypes: CareerAttachmentType[] = [
  "resume",
  "cover_letter",
  "portfolio",
  "certificate",
  "job_posting",
  "other",
];

const isValidUrl = (value: string) => {
  if (!value.trim()) return false;

  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://") ||
    value.includes(":\\") ||
    value.startsWith("/")
  );
};

export const CareerAttachments = ({
  item,
  onChange,
}: CareerAttachmentsProps) => {
  const attachments = item.attachments ?? [];

  const updateAttachment = (
    attachmentId: string,
    patch: Partial<CareerAttachment>
  ) => {
    onChange({
      attachments: attachments.map((attachment) =>
        attachment.id === attachmentId
          ? { ...attachment, ...patch }
          : attachment
      ),
    });
  };

  const addAttachment = () => {
    onChange({
      attachments: [...attachments, createCareerAttachment()],
    });
  };

  const removeAttachment = (attachmentId: string) => {
    onChange({
      attachments: attachments.filter(
        (attachment) => attachment.id !== attachmentId
      ),
    });
  };

  const openAttachment = (url: string) => {
    if (!url.trim()) return;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    navigator.clipboard?.writeText(url);
    window.alert("로컬 경로/파일 링크는 클립보드에 복사했어.");
  };

  return (
    <section className="career-detail-section career-attachments-panel">
      <div className="career-section-title-row">
        <div>
          <div className="career-section-title">Attachments & Links</div>
          <p className="career-section-sub">
            이력서, 포트폴리오, 자소서 파일, 채용공고 링크를 한 곳에서 관리.
          </p>
        </div>

        <button
          type="button"
          onClick={addAttachment}
          className="career-small-button"
        >
          <Plus className="w-3.5 h-3.5" />
          Link
        </button>
      </div>

      <div className="career-attachment-quick-row">
        {item.postingUrl ? (
          <button
            type="button"
            onClick={() => openAttachment(item.postingUrl)}
            className="career-attachment-quick-link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Posting URL
          </button>
        ) : (
          <div className="career-empty-box">
            지원 사이트 URL이 비어 있어. Overview에서 posting URL을 먼저 넣어도 돼.
          </div>
        )}
      </div>

      <div className="career-attachment-list">
        {attachments.length === 0 ? (
          <div className="career-empty-box">
            아직 저장된 첨부 링크가 없어. Resume, Portfolio, Cover Letter 링크를 추가해봐.
          </div>
        ) : (
          attachments.map((attachment) => {
            const valid = isValidUrl(attachment.url);

            return (
              <article key={attachment.id} className="career-attachment-item">
                <div className="career-attachment-top">
                  <div className="career-attachment-icon">
                    <Link2 className="w-4 h-4" />
                  </div>

                  <input
                    value={attachment.label}
                    onChange={(event) =>
                      updateAttachment(attachment.id, {
                        label: event.target.value,
                      })
                    }
                    className="career-attachment-label"
                    placeholder="예: RGA Resume / Portfolio / 자소서 PDF"
                  />

                  <select
                    value={attachment.type}
                    onChange={(event) =>
                      updateAttachment(attachment.id, {
                        type: event.target.value as CareerAttachmentType,
                      })
                    }
                    className="career-attachment-type"
                  >
                    {attachmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {attachmentTypeLabels[type]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => openAttachment(attachment.url)}
                    className={[
                      "career-attachment-open",
                      valid ? "" : "is-disabled",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="career-attachment-delete"
                    title="Delete attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  value={attachment.url}
                  onChange={(event) =>
                    updateAttachment(attachment.id, {
                      url: event.target.value,
                    })
                  }
                  className="career-attachment-url"
                  placeholder="https://drive.google.com/... 또는 로컬 파일 경로"
                />

                <input
                  value={attachment.memo}
                  onChange={(event) =>
                    updateAttachment(attachment.id, {
                      memo: event.target.value,
                    })
                  }
                  className="career-attachment-memo"
                  placeholder="메모: 제출용 / 수정 필요 / 회사별 버전 등"
                />
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

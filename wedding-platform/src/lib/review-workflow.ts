export type ReviewStatus = "draft" | "review_requested" | "changes_requested" | "approved";

const PREFIX = "occasio_review_status_";

export function getReviewStatus(eventId: string): ReviewStatus {
  if (typeof window === "undefined") return "draft";
  const value = localStorage.getItem(`${PREFIX}${eventId}`);
  return value === "review_requested" || value === "changes_requested" || value === "approved" ? value : "draft";
}

export function setReviewStatus(eventId: string, status: ReviewStatus) {
  localStorage.setItem(`${PREFIX}${eventId}`, status);
  window.dispatchEvent(new CustomEvent("occasio:review-updated"));
  return status;
}

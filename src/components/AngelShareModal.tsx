import { useState } from "react";
import { Check, Link2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import FounderportFavicon from "../assets/images/home/Founderport_Favicon_Mariner.svg";

export interface AngelShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  title?: string;
}

export default function AngelShareModal({
  open,
  onOpenChange,
  content,
  title = "Angel AI Connect Idea",
}: AngelShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = content.trim();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || shareText);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareOnX = () => {
    // X has a hard character limit; keep URL and a short excerpt.
    const max = 200;
    const text = shareText.length > max ? `${shareText.slice(0, max).trimEnd()}…` : shareText;
    openExternal(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    );
  };

  const shareOnLinkedIn = () => {
    openExternal(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    );
  };

  const shareOnReddit = () => {
    openExternal(
      `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[min(100%-1.5rem,36rem)] max-w-[36rem] flex-col gap-0 overflow-hidden border border-teal-100 bg-white p-0 text-gray-900 shadow-2xl sm:rounded-2xl"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-teal-100/80 bg-gradient-to-r from-slate-50 to-teal-50 px-5 py-4 text-left sm:text-left">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Share this Angel response
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
          <div className="relative flex h-[min(52vh,26rem)] min-h-[16rem] flex-col overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 p-4 shadow-sm">
            <div className="mb-3 flex shrink-0 flex-wrap gap-2">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                Ask Angel
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                Continue planning
              </span>
            </div>
            <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
              {shareText || "No content to share."}
            </p>
            <div className="mt-3 flex shrink-0 items-center justify-end gap-2">
              <img
                src={FounderportFavicon}
                alt=""
                className="h-5 w-5 object-contain"
              />
              <span className="text-xs font-semibold tracking-wide text-teal-700">
                Founderport
              </span>
            </div>
          </div>

          <div className="mt-5 flex shrink-0 items-start justify-center gap-6 sm:gap-8">
            <button
              type="button"
              onClick={copyLink}
              className="flex w-16 flex-col items-center gap-2 text-gray-600 transition hover:text-teal-700"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm">
                {linkCopied ? (
                  <Check className="h-5 w-5 text-teal-600" />
                ) : (
                  <Link2 className="h-5 w-5" />
                )}
              </span>
              <span className="text-center text-xs font-medium">
                {linkCopied ? "Copied" : "Copy link"}
              </span>
            </button>

            <button
              type="button"
              onClick={shareOnX}
              className="flex w-16 flex-col items-center gap-2 text-gray-600 transition hover:text-teal-700"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.924L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </span>
              <span className="text-center text-xs font-medium">X</span>
            </button>

            <button
              type="button"
              onClick={shareOnLinkedIn}
              className="flex w-16 flex-col items-center gap-2 text-gray-600 transition hover:text-teal-700"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0A66C2] shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </span>
              <span className="text-center text-xs font-medium">LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={shareOnReddit}
              className="flex w-16 flex-col items-center gap-2 text-gray-600 transition hover:text-teal-700"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-[#FF4500] shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
                  <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.265.68-.421 1.092-.421.872 0 1.58.71 1.58 1.582 0 .563-.3 1.056-.746 1.345.01.12.016.241.016.364 0 1.836-2.125 3.326-4.744 3.326-2.62 0-4.745-1.49-4.745-3.326 0-.122.005-.24.014-.358a1.573 1.573 0 01-.733-1.351c0-.872.71-1.582 1.582-1.582.391 0 .745.146 1.024.387 1.222-.86 2.9-1.43 4.752-1.487l.885-4.152a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.7zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.561-1.249-1.249-1.249zm-5.016 3.75c.718.08 1.397.287 1.992.587.595-.3 1.274-.507 1.992-.587.24-.027.46.148.487.39a.48.48 0 01-.39.487c-.66.074-1.284.27-1.82.548-.12.062-.264.062-.385 0-.536-.278-1.16-.474-1.82-.548a.48.48 0 01-.39-.487c.027-.242.248-.417.488-.39z" />
                </svg>
              </span>
              <span className="text-center text-xs font-medium">Reddit</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

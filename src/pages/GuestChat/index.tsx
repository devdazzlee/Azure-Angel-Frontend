import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaLightbulb, FaPaperPlane, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import QuestionFormatter from '../../components/QuestionFormatter';
import SmartInput from '../../components/SmartInput';
import {
  claimGuestSessionIfPresent,
  getGuestAuthError,
  sendGuestMessage,
  startGuestChat,
} from '../../services/guestChatService';
import {
  getGuestSnapshot,
  guestAuthReturnPath,
  guestSignupReturnPath,
  hasGuestSnapshot,
  saveGuestSnapshot,
  type GuestChatMessage,
  type GuestSessionSnapshot,
} from '../../utils/guestSession';
import { getAccessToken } from '../../utils/tokenUtils';

const PICKER_OPTION_LINE_REGEX =
  /^[\s\-–—]*(?:Yes\s*\/\s*No|Yes|No|Later|Full-time employed|Part-time|Student|Unemployed|Self-employed\/freelancer|Self-employed|Freelancer|Other|Be more hands-on|Be more of a mentor|Alternate based on the task|Side hustle|Small business|Scalable startup|Nonprofit\/social venture|Finding customers|Managing finances|Competition|Legal requirements|Time management|Not sure)[\s.]*$/gim;

const PICKER_RATING_LINE_REGEX =
  /^[\s\-–—]*(?:(?:[1-5][\s,.\-–—]+){2,4}[1-5]|[○●◯•][\s]*(?:[○●◯•][\s]*){3,4}|1\s*[-–—]\s*5)[\s.]*$/gm;

function stripPickerOptionLines(text: string): string {
  return text
    .replace(PICKER_OPTION_LINE_REGEX, '')
    .replace(PICKER_RATING_LINE_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isolateQuestionPreview(text: string): string {
  const cleaned = stripPickerOptionLines(text)
    .replace(/\[\[Q:[^\]]+\]\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = cleaned.toLowerCase();
  if (lower.includes('how comfortable are you with these business skills')) {
    return 'How comfortable are you with these business skills?';
  }

  const match = cleaned.match(/[^?!]*\?/g);
  if (match?.length) {
    const q = match[match.length - 1].trim();
    return q.length > 140 ? `${q.slice(0, 137)}…` : q;
  }
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned;
}

const STARTER_PROMPTS = [
  { label: 'Create a business plan', text: 'I want to create a business plan' },
  { label: 'Find market opportunities', text: 'Help me find market opportunities' },
  { label: 'Marketing strategy', text: 'I need a marketing strategy' },
  { label: 'Financial forecast', text: 'Help me think through a financial forecast' },
];

const GuestChatPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bootstrapped = useRef(false);
  const claimAttempted = useRef(false);

  const [messages, setMessages] = useState<GuestChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [guest, setGuest] = useState<GuestSessionSnapshot | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authGateReason, setAuthGateReason] = useState(
    'Create a free account to save your chat and continue into Business Planning.',
  );
  const [claiming, setClaiming] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'choices' | 'rating'>('text');

  const handleInputModeChange = useCallback((mode: 'text' | 'choices' | 'rating') => {
    setInputMode(mode);
  }, []);

  const isLoggedIn = Boolean(getAccessToken());
  const isAnswerPanel = inputMode === 'choices' || inputMode === 'rating';

  const lastAssistantQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].content;
    }
    return '';
  }, [messages]);

  const questionPreview = useMemo(
    () => isolateQuestionPreview(lastAssistantQuestion),
    [lastAssistantQuestion],
  );

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const showStarterPills = !loading && userMessageCount === 0 && !showAuthGate && !sending && !isAnswerPanel;

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const applyGuest = useCallback((next: GuestSessionSnapshot | undefined | null) => {
    if (!next) return;
    setGuest(next);
    saveGuestSnapshot(next);
    if (next.history?.length) setMessages(next.history);
    if (next.requires_auth_to_continue || next.awaiting_gky_proceed) {
      setAuthGateReason(
        'You’ve finished Getting to Know You. Log in or sign up to continue from this exact spot.',
      );
      setShowAuthGate(true);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      try {
        const existing = getGuestSnapshot();
        if (
          existing?.guest_token &&
          existing.session_id &&
          (existing.history?.length || existing.requires_auth_to_continue)
        ) {
          applyGuest(existing);
          if (existing.requires_auth_to_continue) setShowAuthGate(true);
          setLoading(false);
          return;
        }

        const result = await startGuestChat('Guest chat');
        if (result.reply) setMessages([{ role: 'assistant', content: result.reply }]);
        applyGuest(result.guest || null);
      } catch (err) {
        console.error(err);
        toast.error('Could not start guest chat. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [applyGuest]);

  useEffect(() => {
    if (!isAnswerPanel) scrollChatToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages, sending, isAnswerPanel, scrollChatToBottom]);

  useEffect(() => {
    if (!isLoggedIn || claimAttempted.current) return;
    claimAttempted.current = true;

    (async () => {
      if (!hasGuestSnapshot()) {
        navigate('/ventures', { replace: true });
        return;
      }
      setClaiming(true);
      try {
        const claimed = await claimGuestSessionIfPresent();
        navigate(claimed?.resume_path || '/ventures', { replace: true });
      } catch {
        navigate('/ventures', { replace: true });
      } finally {
        setClaiming(false);
      }
    })();
  }, [isLoggedIn, navigate]);

  if (isLoggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 pt-20 text-sm text-slate-600">
        {claiming ? 'Restoring your chat…' : 'Redirecting…'}
      </div>
    );
  }

  const openAuthGate = (reason?: string) => {
    if (reason) setAuthGateReason(reason);
    setShowAuthGate(true);
  };

  const sendAnswer = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending || !guest?.guest_token || !guest.session_id) return;

    if (guest.requires_auth_to_continue || guest.awaiting_gky_proceed) {
      openAuthGate();
      return;
    }

    if ((guest.user_message_count || 0) >= (guest.message_limit || 5)) {
      openAuthGate('Guest chat is limited to 5 messages. Log in or sign up to continue.');
      return;
    }

    setSending(true);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const result = await sendGuestMessage(guest.session_id, guest.guest_token, text);
      if (result.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      }
      applyGuest(result.guest || null);

      if (result.requires_auth_to_continue || result.awaiting_gky_proceed) {
        openAuthGate(
          'You’ve finished Getting to Know You. Log in or sign up to continue from this exact spot.',
        );
      }
    } catch (err) {
      const authErr = getGuestAuthError(err);
      if (authErr?.requiresAuth) {
        openAuthGate(authErr.message);
      } else {
        toast.error('Failed to send message. Please try again.');
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
      }
    } finally {
      setSending(false);
    }
  };

  const remaining = guest?.messages_remaining ?? Math.max(0, 5 - (guest?.user_message_count || 0));

  return (
    <div className="min-h-screen bg-[#f7f8fb] pt-20 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6 lg:py-8">
        {/* Main column — mockup-style center chat */}
        <section className="flex min-h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Try Angel
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Start now — no account required
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {remaining} of 5 guest messages left · chat is not saved until you sign up
              </p>
            </div>
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              Free guest chat
            </span>
          </div>

          {isAnswerPanel ? (
            <>
              <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                  Current question
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{questionPreview}</p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                {showAuthGate ? (
                  <AuthInline />
                ) : (
                  <SmartInput
                    value={input}
                    onChange={setInput}
                    onSubmit={(value) => void sendAnswer(value)}
                    currentQuestion={lastAssistantQuestion}
                    currentPhase="GKY"
                    disabled={sending || loading}
                    loading={sending}
                    placeholder="Ask Founderport anything…"
                    compactChoices
                    onModeChange={handleInputModeChange}
                    fillHeight
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#fafbfd] px-4 py-5 sm:px-6"
              >
                {loading ? (
                  <p className="text-sm text-slate-500">Starting your chat with Angel…</p>
                ) : (
                  messages.map((msg, idx) => {
                    const displayText =
                      msg.role === 'assistant' ? stripPickerOptionLines(msg.content) : msg.content;
                    return (
                      <div
                        key={`${msg.role}-${idx}`}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-800 shadow-sm'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <QuestionFormatter text={displayText || msg.content} phase="GKY" />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {sending ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Angel is typing…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
                {showStarterPills ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        disabled={sending || loading}
                        onClick={() => void sendAnswer(prompt.text)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                      >
                        <FaLightbulb className="h-3 w-3 text-amber-500" />
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {showAuthGate ? (
                  <AuthInline />
                ) : (
                  <SmartInput
                    value={input}
                    onChange={setInput}
                    onSubmit={(value) => void sendAnswer(value)}
                    currentQuestion={lastAssistantQuestion}
                    currentPhase="GKY"
                    disabled={sending || loading}
                    loading={sending}
                    placeholder="Ask Founderport anything…"
                    compactChoices
                    onModeChange={handleInputModeChange}
                  />
                )}
              </div>
            </>
          )}
        </section>

        {/* Right sidebar — mockup-inspired */}
        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <FaPaperPlane className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Get started instantly</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                'Free to use without login',
                'Chat with Angel right away',
                'Sign up later to save your progress',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Create an account for more</h2>
            <p className="mt-2 text-sm text-slate-500">
              Save your chat, unlock Business Planning, and continue exactly where you left off.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to={guestSignupReturnPath()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FaUserPlus /> Sign up
              </Link>
              <Link
                to={guestAuthReturnPath()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <FaSignInAlt /> Log in
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
            <p className="font-medium leading-relaxed">
              “Your vision + AI guidance = a stronger tomorrow.”
            </p>
            <p className="mt-3 text-xs font-semibold text-blue-700">— Founderport</p>
          </div>
        </aside>
      </div>

      {showAuthGate ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900">Continue with an account</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{authGateReason}</p>
            <p className="mt-2 text-sm text-slate-500">
              After you log in or sign up, we’ll bring you back to this same conversation.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(guestSignupReturnPath())}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <FaUserPlus /> Sign up
              </button>
              <button
                type="button"
                onClick={() => navigate(guestAuthReturnPath())}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-700"
              >
                <FaSignInAlt /> Log in
              </button>
            </div>
            {!guest?.requires_auth_to_continue && remaining > 0 ? (
              <button
                type="button"
                onClick={() => setShowAuthGate(false)}
                className="mt-3 w-full text-center text-sm text-slate-500 underline-offset-2 hover:underline"
              >
                Keep chatting ({remaining} messages left)
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

function AuthInline() {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-center text-sm text-blue-900">
      Log in or sign up to continue from where you left off.
      <div className="mt-3 flex justify-center gap-2">
        <Link
          to={guestSignupReturnPath()}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Sign up
        </Link>
        <Link
          to={guestAuthReturnPath()}
          className="rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

export default GuestChatPage;

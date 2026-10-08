import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaChartBar,
  FaCheckCircle,
  FaChevronRight,
  FaFileAlt,
  FaHome,
  FaLightbulb,
  FaPaperPlane,
  FaPencilAlt,
  FaProjectDiagram,
  FaSearch,
  FaSignInAlt,
  FaUserPlus,
} from 'react-icons/fa';
import { HiOutlineTemplate, HiOutlineBookOpen } from 'react-icons/hi';
import { toast } from 'react-toastify';
import QuestionFormatter from '../QuestionFormatter';
import SmartInput from '../SmartInput';
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

const GKY_TOTAL = 5;

/** Current GKY step from session tag (GKY.01–GKY.05). Ignores GKY.05_ACK. */
function gkyQuestionFromTag(askedQ?: string | null): number | null {
  if (!askedQ?.startsWith('GKY.') || askedQ.includes('ACK')) return null;
  const match = askedQ.match(/\.(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= GKY_TOTAL ? n : null;
}

const STARTER_PROMPTS = [
  { label: 'Create a business plan', text: 'I want to create a business plan' },
  { label: 'Find market opportunities', text: 'Help me find market opportunities' },
  { label: 'Marketing strategy', text: 'I need a marketing strategy' },
  { label: 'Financial forecast', text: 'Help me think through a financial forecast' },
];

const FEATURE_CARDS = [
  {
    title: 'Create a Business Plan',
    description: 'Build a structured plan with AI guidance',
    prompt: 'I want to create a business plan',
    icon: FaLightbulb,
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    title: 'Do Market Research',
    description: 'Understand your market and customers',
    prompt: 'Help me do market research for my business idea',
    icon: FaSearch,
    iconBg: 'bg-sky-100 text-sky-600',
  },
  {
    title: 'Build a Financial Plan',
    description: 'Forecast costs, revenue, and runway',
    prompt: 'Help me build a financial plan',
    icon: FaChartBar,
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'Create a Pitch Deck',
    description: 'Tell your story to investors or partners',
    prompt: 'I need help creating a pitch deck outline',
    icon: FaFileAlt,
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'Generate Business Ideas',
    description: 'Explore opportunities that fit you',
    prompt: 'Help me generate business ideas',
    icon: FaPencilAlt,
    iconBg: 'bg-pink-100 text-pink-600',
  },
  {
    title: 'Get AI Guidance',
    description: 'Ask anything about starting your business',
    prompt: 'I need guidance on starting my business',
    icon: FaProjectDiagram,
    iconBg: 'bg-teal-100 text-teal-600',
  },
];

const QUICK_ACCESS = [
  { label: 'Business Plan Generator', prompt: 'I want to create a business plan' },
  { label: 'Market Research', prompt: 'Help me do market research' },
  { label: 'Financial Plan', prompt: 'Help me build a financial plan' },
  { label: 'Pitch Deck Builder', prompt: 'Help me create a pitch deck' },
];

const SIDE_NAV = [
  { label: 'Home', to: '/', icon: FaHome, active: true },
  { label: 'Explore Tools', to: '/services', icon: FaSearch },
  { label: 'Templates', to: '/learn-more', icon: HiOutlineTemplate },
  { label: 'Resources', to: '/documentation', icon: HiOutlineBookOpen },
  { label: 'My Projects', to: '/login', icon: FaFileAlt },
];

const HomeTryExperience: React.FC = () => {
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
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const handleInputModeChange = useCallback((mode: 'text' | 'choices' | 'rating') => {
    setInputMode(mode);
  }, []);

  const isLoggedIn = Boolean(getAccessToken());
  const lastAssistantQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].content;
    }
    return '';
  }, [messages]);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const inStructuredAnswer = inputMode === 'choices' || inputMode === 'rating';
  const showMarketingHero = !loading && userMessageCount === 0 && messages.length === 0;
  const showStarterPills =
    !loading &&
    userMessageCount === 0 &&
    !showAuthGate &&
    !sending &&
    inputMode === 'text' &&
    messages.length <= 1;

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
    scrollChatToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages, sending, inputMode, scrollChatToBottom]);

  useEffect(() => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const active = !showMarketingHero && mobile;
    document.body.classList.toggle('try-guest-chat-active', active);
    return () => document.body.classList.remove('try-guest-chat-active');
  }, [showMarketingHero]);

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
      <div className="flex min-h-[40vh] items-center justify-center bg-[#f7f8fb] py-16 text-sm text-slate-600">
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
  const gkyQuestionNumber = gkyQuestionFromTag(guest?.asked_q);
  const gkyComplete =
    Boolean(guest?.awaiting_gky_proceed || guest?.requires_auth_to_continue) ||
    guest?.asked_q === 'GKY.05_ACK';
  const visibleStarterPills = showAllPrompts ? STARTER_PROMPTS : STARTER_PROMPTS.slice(0, 4);

  const chatActive = !showMarketingHero;

  return (
    <div
      className={`bg-[#f7f8fb] text-slate-900 ${
        chatActive
          ? 'max-lg:fixed max-lg:inset-x-0 max-lg:top-20 max-lg:bottom-0 max-lg:z-30 max-lg:overflow-x-hidden max-lg:overflow-y-hidden'
          : ''
      }`}
    >
      <div
        className={`mx-auto grid max-w-[1400px] gap-5 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-6 lg:px-6 lg:py-8 ${
          chatActive ? 'h-full max-lg:gap-0 max-lg:px-2 max-lg:py-2' : 'px-4 py-6'
        }`}
      >
        {/* Left sidebar */}
        <aside className="hidden flex-col gap-6 lg:flex">
          <nav className="space-y-1">
            {SIDE_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    item.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick Access
            </p>
            <ul className="space-y-0.5">
              {QUICK_ACCESS.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => void sendAnswer(item.prompt)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
                  >
                    <span>{item.label}</span>
                    <FaChevronRight className="h-3 w-3 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
            <h3 className="text-sm font-bold text-slate-900">Create More, Achieve More</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sign up to save projects, unlock planning tools, and pick up where you left off.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to={guestSignupReturnPath()}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Sign Up Free
              </Link>
              <Link
                to={guestAuthReturnPath()}
                className="inline-flex items-center justify-center rounded-xl border border-blue-600 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Log In
              </Link>
            </div>
          </div>
        </aside>

        {/* Center — fixed-height chat once conversation starts */}
        <section
          className={`flex min-h-0 w-full min-w-0 max-w-full flex-col gap-5 max-lg:min-h-0 max-lg:flex-1 ${
            showMarketingHero ? '' : 'h-full max-h-full lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]'
          }`}
        >
          {showMarketingHero ? (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-sm">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.12),transparent_55%)]" />
                <div className="relative mx-auto max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Founderport
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
                    Turn Your Business Idea Into{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                      A Real Launch Plan
                    </span>
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
                    Get expert guidance, step-by-step planning, and actionable strategies — all
                    powered by AI. Start now, no account required.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {FEATURE_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      disabled={sending || loading}
                      onClick={() => void sendAnswer(card.prompt)}
                      className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md disabled:opacity-60"
                    >
                      <div
                        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">{card.title}</h2>
                      <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
                        {card.description}
                      </p>
                      <span className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400 transition group-hover:border-blue-200 group-hover:text-blue-600">
                        <FaChevronRight className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div
            className={`flex w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${
              showMarketingHero
                ? 'min-h-[min(480px,62vh)]'
                : 'min-h-0 h-full max-h-full'
            }`}
          >
            {!showMarketingHero ? (
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                    Chat with Angel
                  </p>
                  <p className="text-xs text-slate-500">
                    {gkyComplete ? (
                      <>Getting to know you complete · sign up to continue</>
                    ) : gkyQuestionNumber != null ? (
                      <>
                        Question {gkyQuestionNumber} of {GKY_TOTAL}
                        {' · '}
                        {remaining} guest {remaining === 1 ? 'message' : 'messages'} left
                      </>
                    ) : (
                      <>
                        {remaining} guest {remaining === 1 ? 'message' : 'messages'} left · sign up
                        to save your progress
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth bg-[#fafbfd] px-3 pb-6 sm:px-4"
              aria-label="Chat with Angel"
            >
              <div className="mx-auto flex min-h-full w-full min-w-0 max-w-3xl flex-col">
                <div className="flex-1 space-y-4 py-4 sm:space-y-5 sm:py-5">
                  {messages.map((msg, idx) => {
                    const displayText =
                      msg.role === 'assistant' ? stripPickerOptionLines(msg.content) : msg.content;
                    return (
                      <div
                        key={`${msg.role}-${idx}`}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${
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
                  })}
                  {sending ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Angel is typing…
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto w-full min-w-0 max-w-full space-y-3 pb-2 pt-1">
                  {loading ? (
                    <p className="text-center text-sm text-slate-500">
                      Starting your chat with Angel…
                    </p>
                  ) : null}

                  {showStarterPills ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {visibleStarterPills.map((prompt) => (
                        <button
                          key={prompt.label}
                          type="button"
                          disabled={sending || loading}
                          onClick={() => void sendAnswer(prompt.text)}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                        >
                          {prompt.label}
                        </button>
                      ))}
                      {!showAllPrompts ? (
                        <button
                          type="button"
                          onClick={() => setShowAllPrompts(true)}
                          className="inline-flex items-center rounded-full border border-dashed border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-700"
                        >
                          More
                        </button>
                      ) : null}
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
                      onModeChange={handleInputModeChange}
                    />
                  )}

                  {!inStructuredAnswer ? (
                    <p className="text-center text-[11px] text-slate-400">
                      Powered by Founderport AI · Your idea. Our guidance.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-xl bg-blue-600 px-3 py-2 text-xs text-white">
                Welcome to Founderport. How can I help you today?
              </div>
              <div className="ml-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                I want to turn my idea into a launch plan.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FaPaperPlane className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Get started instantly</h2>
            <p className="mt-2 text-xs text-slate-500">
              You can start using Founderport right now — no account required.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              {[
                'Free to use without login',
                'Explore all tools & features',
                'Get instant AI guidance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-xs sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Or
            </p>
            <h2 className="mt-2 text-base font-bold text-slate-900">Create an account for more</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Save your work, unlock Business Planning, and continue exactly where you left off.
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
            <p className="text-xs font-medium italic leading-relaxed">
              “Your vision + AI guidance = A stronger tomorrow.”
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

export default HomeTryExperience;

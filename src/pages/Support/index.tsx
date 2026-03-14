import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Mail, MessageSquare, Phone, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { supportService } from '../../services/supportService';

const faqItems = [
  {
    question: 'What is FounderPort and how can it help my startup?',
    answer:
      'FounderPort is an AI-powered platform designed to help founders plan, launch, and grow their businesses. It provides tools for business planning, market research, financial projections, and strategic guidance — all tailored to your specific industry and goals.',
  },
  {
    question: 'How do I get started with FounderPort?',
    answer:
      'Simply create an account, complete a brief onboarding questionnaire about your business idea, and our AI will generate a personalized roadmap. From there you can dive into detailed business plans, competitor analysis, financial models, and more.',
  },
  {
    question: 'Is my data secure on FounderPort?',
    answer:
      'Absolutely. We use industry-standard encryption (AES-256 at rest, TLS 1.3 in transit) and never share your data with third parties. Your business information remains private and is only used to power your personalized experience.',
  },
  {
    question: 'What pricing plans are available?',
    answer:
      'We offer a free tier with core features so you can explore the platform, plus Pro and Enterprise plans with advanced analytics, unlimited AI generations, priority support, and team collaboration tools. Visit our Pricing page for full details.',
  },
  {
    question: 'Can I collaborate with my co-founders or team?',
    answer:
      'No, but we plan to build this in the future! Team collaboration and shared workspaces are not available in the product yet.',
  },
  {
    question: 'How do I contact support if I have an issue?',
    answer:
      'You can reach us anytime using the contact form on this page, or email us directly at support@founderport.ai. We typically respond within 1–2 business days, and critical issues are prioritized.',
  },
];

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialForm: ContactFormState = {
  name: '',
  email: '',
  subject: 'general_inquiry',
  message: '',
};

export default function Support() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);

  const subjectLabel = useMemo(() => {
    switch (form.subject) {
      case 'technical_support':
        return 'Technical Support';
      case 'billing':
        return 'Billing';
      case 'feature_request':
        return 'Feature Request';
      case 'partnership':
        return 'Partnership';
      default:
        return 'General Inquiry';
    }
  }, [form.subject]);

  const onChange = (field: keyof ContactFormState, value: string) => {
    if (submissionSucceeded) setSubmissionSucceeded(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await supportService.sendContactForm({
        ...form,
        subject: subjectLabel,
      });
      toast.success('Message sent. We will get back to you soon.');
      setSubmissionSucceeded(true);
      setForm(initialForm);
    } catch (error) {
      console.error('Contact form submission failed', error);
      // Error toast is shown by httpClient interceptor with backend details
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white px-4 pb-24 pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute right-[-4rem] top-48 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              <Sparkles className="h-3.5 w-3.5" />
              Customer Support
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Contact Us & FAQ</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Have a question or need help? Send your message directly to our team and we'll get back to you as soon as possible.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="mb-1 flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-teal-600" /> Email</div>
              <a href="mailto:support@founderport.ai" className="text-teal-700 hover:underline">support@founderport.ai</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="mb-1 flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-teal-600" /> Response</div>
              Usually within 1-2 business days
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="mb-1 flex items-center gap-2 font-semibold"><Phone className="h-4 w-4 text-teal-600" /> Priority</div>
              Critical support issues are handled first
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(value) => onChange('subject', value)}>
                <SelectTrigger className="mt-2 w-full min-w-0 bg-white text-slate-900 border-slate-200">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) => onChange('message', e.target.value)}
                placeholder="Tell us how we can help..."
                className="mt-2"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 text-white hover:bg-teal-700">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
              {submissionSucceeded && (
                <span className="text-sm font-medium text-emerald-600">
                  Message sent successfully.
                </span>
              )}
            </div>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm md:p-8"
        >
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="mt-2 text-slate-600">
            Find answers to common questions about FounderPort below. If you need further help, feel free to reach out using the contact form above.
          </p>

          <Accordion type="single" collapsible className="mt-6 w-full space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="rounded-xl border border-slate-200 px-4 last:border-b"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';

// Mock reviews data — in production this comes from Google My Business API
const MOCK_REVIEWS = [
  { id: '1', author: 'Omar Khalid', rating: 5, text: 'Excellent service! The AI receptionist made booking so easy. Highly recommend Dr. Rahman.', date: '2026-06-01', replied: false },
  { id: '2', author: 'Sara Ahmed', rating: 4, text: 'Great clinic, very professional staff. The reminder messages were very helpful.', date: '2026-05-28', replied: true },
  { id: '3', author: 'Mohammed Hassan', rating: 5, text: 'Best dental clinic in Dubai! Painless treatment and super friendly staff.', date: '2026-05-20', replied: false },
  { id: '4', author: 'Aisha Al-Farsi', rating: 3, text: 'Good clinic but had to wait longer than expected. The AI booking system is great though.', date: '2026-05-15', replied: false },
];

const RATING_DISTRIBUTION = [
  { stars: 5, count: 12, pct: 67 },
  { stars: 4, count: 4, pct: 22 },
  { stars: 3, count: 1, pct: 6 },
  { stars: 2, count: 1, pct: 5 },
  { stars: 1, count: 0, pct: 0 },
];

export default function ReviewsPage() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const avgRating = 4.8;
  const totalReviews = 18;

  const handleSendReviewRequests = () => {
    toast.success('Review requests sent to recent patients via WhatsApp!');
  };

  const handleSubmitReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    toast.success('Reply submitted to Google');
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-page-title">Google Reviews</h1>
        <Button onClick={handleSendReviewRequests}>
          <Send className="w-4 h-4" /> Request Reviews
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating overview */}
        <div className="card card-body text-center">
          <p className="text-[56px] font-extrabold text-primary leading-none">{avgRating}</p>
          <div className="flex justify-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-5 h-5"
                fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'}
                stroke="#f59e0b"
              />
            ))}
          </div>
          <p className="text-sm text-muted font-semibold mb-4">{totalReviews} reviews</p>

          {/* Distribution */}
          <div className="space-y-2">
            {RATING_DISTRIBUTION.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted w-4 text-right">{stars}</span>
                <Star className="w-3 h-3 text-amber fill-amber flex-shrink-0" />
                <div className="flex-1 h-2 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-4">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted mb-2">Google Business URL</p>
            <input
              className="input text-xs"
              placeholder="https://g.page/your-clinic"
              defaultValue=""
            />
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-3">
          {MOCK_REVIEWS.map((review) => (
            <div key={review.id} className="card card-body !p-4">
              <div className="flex items-start gap-3">
                <Avatar name={review.author} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-bold text-primary">{review.author}</p>
                    <p className="text-xs text-muted flex-shrink-0">
                      {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-3.5 h-3.5"
                        fill={s <= review.rating ? '#f59e0b' : 'none'}
                        stroke="#f59e0b"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{review.text}</p>

                  {review.replied ? (
                    <div className="mt-3 pl-3 border-l-2 border-brand">
                      <p className="text-xs font-bold text-brand">Your reply</p>
                      <p className="text-xs text-muted mt-0.5">
                        Thank you for your kind words! We look forward to seeing you again.
                      </p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="input resize-none w-full text-xs"
                        rows={3}
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(review.id)}
                        >
                          Post Reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-2 text-xs font-bold text-brand hover:text-brand-dark"
                    >
                      Reply →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Star, MessageSquarePlus, Check, X } from 'lucide-react';

interface ReviewsPageProps {
  product: Product;
  onReviewAdded?: (newReview: Review) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ product, onReviewAdded }) => {
  const { user, openAuthModal } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const data = await api.getReviews(product.id);
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [product.id]);

  // Distribution calculation
  const totalCount = reviews.length || product.reviewCount || 1;
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const pct = Math.round((count / totalCount) * 100);
    return { stars, pct, count };
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const newReview = await api.postReview(
        product.id,
        rating,
        text,
        pros,
        cons,
        user?.name || authorName || 'Verified Consumer'
      );
      setReviews([newReview, ...reviews]);
      setShowForm(false);
      setText('');
      setPros('');
      setCons('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      if (onReviewAdded) onReviewAdded(newReview);
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wrap py-10 animate-fadein">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-['Manrope'] text-slate-900">
            Customer reviews
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Community feedback and label clarity ratings for <b className="text-slate-800">{product.name}</b>
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              openAuthModal();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="btn btn-primary btn-sm self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Review submitted successfully and recorded in the database!</span>
        </div>
      )}

      {/* Review Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-fadein space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-['Manrope'] text-slate-900">
              Review {product.name}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-500 focus:outline-none transition-colors"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-500 fill-amber-500' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="e.g. Ramesh K."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comments</label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="How was the product taste, packaging clarity, and label accuracy?"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pros</label>
              <input
                type="text"
                value={pros}
                onChange={e => setPros(e.target.value)}
                placeholder="e.g. Low sugar, crispy"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cons</label>
              <input
                type="text"
                value={cons}
                onChange={e => setCons(e.target.value)}
                placeholder="e.g. Small print on back"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? 'Posting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs mb-8">
        <div className="text-center sm:text-left flex flex-col items-center sm:items-start justify-center">
          <div className="text-5xl font-extrabold font-['Manrope'] text-slate-900 leading-none">
            {product.rating}
          </div>
          <div className="flex text-amber-500 my-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(product.rating) ? 'fill-amber-500' : 'stroke-amber-500'}`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Based on {reviews.length || product.reviewCount} customer reviews
          </div>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(d => (
            <div key={d.stars} className="grid grid-cols-[48px_1fr_36px] items-center gap-2.5 text-xs text-slate-600">
              <span>{d.stars} star</span>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${d.pct}%` }}></div>
              </div>
              <span className="text-right text-slate-400 font-medium">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading reviews from database...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
            No customer reviews yet. Be the first to share your experience!
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <span className="font-bold text-sm text-slate-900">{r.user}</span>
                <span className="text-xs text-slate-400">{r.date}</span>
              </div>
              <div className="flex text-amber-500 mb-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-amber-500' : 'stroke-amber-500'}`}
                  />
                ))}
              </div>
              <div className="text-sm text-slate-800 mb-3 leading-relaxed">
                {r.text}
              </div>
              <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-slate-100">
                <div>
                  <b className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Pros</b>
                  <span className="text-slate-700">{r.pros}</span>
                </div>
                <div>
                  <b className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Cons</b>
                  <span className="text-slate-700">{r.cons}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

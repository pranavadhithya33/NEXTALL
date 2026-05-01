"use client";

import useSWR from 'swr';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trash2 } from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function ReviewsTab() {
  const { data, mutate } = useSWR('/api/admin/reviews', fetcher);

  const reviews = data?.reviews || [];

  const approveReview = async (id: string) => {
    try {
      await axios.patch(`/api/admin/reviews/${id}`, { is_approved: true });
      toast.success('Review approved');
      mutate();
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await axios.delete(`/api/admin/reviews/${id}`);
      toast.success('Review deleted');
      mutate();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
          <tr>
            <th className="p-4">PRODUCT</th>
            <th className="p-4">CUSTOMER</th>
            <th className="p-4">RATING</th>
            <th className="p-4 w-1/3">COMMENT</th>
            <th className="p-4">STATUS</th>
            <th className="p-4">DATE</th>
            <th className="p-4 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reviews.map((review: any) => (
            <tr key={review.id} className="hover:bg-gray-50/50">
              <td className="p-4">
                <div className="font-medium line-clamp-2">{review.products?.name}</div>
              </td>
              <td className="p-4">
                <div className="font-semibold">{review.customer_name}</div>
              </td>
              <td className="p-4 text-amber-500">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </td>
              <td className="p-4 text-gray-600">
                <div className="line-clamp-2">{review.comment}</div>
              </td>
              <td className="p-4">
                {review.is_approved ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                )}
              </td>
              <td className="p-4 text-gray-500">
                {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  {!review.is_approved && (
                    <Button variant="ghost" size="icon" onClick={() => approveReview(review.id)} title="Approve">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteReview(review.id)} title="Delete">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No reviews yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

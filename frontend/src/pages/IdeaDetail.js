import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Edit, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function IdeaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdea();
    fetchComments();
  }, [id]);

  const fetchIdea = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}`);
      setIdea(response.data);
    } catch (error) {
      console.error('Failed to fetch idea:', error);
      toast.error('Failed to load Eye-dea');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/comments`, {
        comment_text: newComment
      });
      toast.success('Comment added');
      setNewComment('');
      fetchComments();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleApprove = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/approve`, {
        comment: actionComment || null
      });
      toast.success('Eye-dea approved!');
      setActionComment('');
      fetchIdea();
      fetchComments();
    } catch (error) {
      toast.error('Failed to approve Eye-dea');
    }
  };

  const handleDecline = async () => {
    if (!actionComment.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/decline`, {
        comment: actionComment
      });
      toast.success('Eye-dea declined');
      setActionComment('');
      fetchIdea();
      fetchComments();
    } catch (error) {
      toast.error('Failed to decline Eye-dea');
    }
  };

  const handleRequestRevision = async () => {
    if (!actionComment.trim()) {
      toast.error('Please provide revision comments');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/request-revision`, {
        comment: actionComment
      });
      toast.success('Revision requested');
      setActionComment('');
      fetchIdea();
      fetchComments();
    } catch (error) {
      toast.error('Failed to request revision');
    }
  };

  const handleResubmit = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/resubmit`);
      toast.success('Eye-dea resubmitted for review');
      fetchIdea();
    } catch (error) {
      toast.error('Failed to resubmit Eye-dea');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      approved: { className: 'bg-green-100 text-green-800 border-green-300' },
      declined: { className: 'bg-red-100 text-red-800 border-red-300' },
      revision_requested: { className: 'bg-orange-100 text-orange-800 border-orange-300' }
    };
    return variants[status] || {};
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      declined: 'Declined',
      revision_requested: 'Revision Requested'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!idea) {
    return <div className="text-center py-12">Eye-dea not found</div>;
  }

  const isApprover = user?.role === 'approver' || user?.role === 'admin';
  const isOwner = idea.submitted_by === user?.id;
  const canEdit = isOwner && (idea.status === 'revision_requested' || idea.status === 'pending');

  return (
    <div data-testid="idea-detail-page">
      <Button
        data-testid="back-btn"
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/ideas')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Eye-deas
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-3xl">{idea.title}</CardTitle>
                  <Badge {...getStatusBadge(idea.status)} data-testid="idea-status">
                    {getStatusLabel(idea.status)}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {idea.idea_number} • Submitted by {idea.submitted_by_username}
                </CardDescription>
              </div>
              {canEdit && (
                <Button
                  data-testid="edit-idea-btn"
                  onClick={() => navigate(`/ideas/edit/${idea.id}`)}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Eye-dea Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Pillar</label>
                <p className="text-gray-900">{idea.pillar}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Improvement Type</label>
                <p className="text-gray-900">{idea.improvement_type}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Department</label>
                <p className="text-gray-900">{idea.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Team</label>
                <p className="text-gray-900">{idea.team || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Target Completion</label>
                <p className="text-gray-900">{idea.target_completion}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Assigned Approver</label>
                <p className="text-gray-900">{idea.assigned_approver_username || 'Not assigned'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Current Process</label>
              <p className="text-gray-900 whitespace-pre-wrap">{idea.current_process}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Suggested Solution</label>
              <p className="text-gray-900 whitespace-pre-wrap">{idea.suggested_solution}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Benefits</label>
              <p className="text-gray-900 whitespace-pre-wrap">{idea.benefits}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resubmit Button */}
        {isOwner && idea.status === 'revision_requested' && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">Revision Requested</h3>
                  <p className="text-sm text-orange-700">Please review the comments below and update your Eye-dea.</p>
                </div>
                <Button
                  data-testid="resubmit-btn"
                  onClick={handleResubmit}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resubmit for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approver Actions */}
        {isApprover && idea.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Approver Actions</CardTitle>
              <CardDescription>Review and take action on this Eye-dea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Comment (optional for approval)</label>
                <Textarea
                  data-testid="action-comment-input"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Add your feedback or comments..."
                  rows={4}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="approve-btn"
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  data-testid="decline-btn"
                  onClick={handleDecline}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  data-testid="request-revision-btn"
                  onClick={handleRequestRevision}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comments & Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4" data-testid={`comment-${comment.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{comment.username}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Add Comment</label>
              <Textarea
                data-testid="new-comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
              />
              <Button
                data-testid="add-comment-btn"
                onClick={handleAddComment}
                className="mt-3 bg-blue-700 hover:bg-blue-800"
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
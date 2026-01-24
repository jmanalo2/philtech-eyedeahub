import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Edit, Send, Star, Settings, Trash2, Paperclip, Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import CIEvaluationPanel from '../components/CIEvaluationPanel';

export default function IdeaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Preserve the previous filter state from where user came from
  const previousFilters = location.state?.filters || '';

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

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    setUpdatingStatus(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}/ci-update-status`, {
        new_status: newStatus
      });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      setShowStatusDialog(false);
      setNewStatus('');
      fetchIdea();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteIdea = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/${id}`);
      toast.success('Eye-dea deleted successfully');
      navigate('/ideas');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete Eye-dea');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      approved: { className: 'bg-green-100 text-green-800 border-green-300' },
      implemented: { className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      assigned_to_te: { className: 'bg-purple-100 text-purple-800 border-purple-300' },
      declined: { className: 'bg-red-100 text-red-800 border-red-300' },
      revision_requested: { className: 'bg-orange-100 text-orange-800 border-orange-300' }
    };
    return variants[status] || {};
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      implemented: 'Implemented',
      assigned_to_te: 'Assigned to T&E',
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
  const isCIExcellence = (user?.role === 'approver' && user?.sub_role === 'ci_excellence') || user?.role === 'admin';
  const canChangeStatus = isCIExcellence && idea.status === 'assigned_to_te';

  const handleBackToIdeas = () => {
    // Navigate back with preserved filters
    if (previousFilters) {
      navigate(`/ideas?${previousFilters}`);
    } else {
      navigate('/ideas');
    }
  };

  return (
    <div data-testid="idea-detail-page">
      <Button
        data-testid="back-btn"
        variant="ghost"
        className="mb-6"
        onClick={handleBackToIdeas}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Eye-deas
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <CardTitle className="text-xl sm:text-3xl">{idea.title}</CardTitle>
                  <Badge {...getStatusBadge(idea.status)} data-testid="idea-status" className="text-xs sm:text-sm">
                    {getStatusLabel(idea.status)}
                  </Badge>
                </div>
                <CardDescription className="text-sm sm:text-base">
                  {idea.idea_number} • Submitted by {idea.submitted_by_username}
                  {idea.is_best_idea && (
                    <Badge className="ml-2 sm:ml-3 bg-yellow-500 text-white text-xs">
                      <Star className="w-3 h-3 mr-1" /> Best Eye-dea
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {canChangeStatus && (
                  <Button
                    data-testid="edit-status-btn"
                    onClick={() => setShowStatusDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-sm"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Edit Status</span>
                    <span className="xs:hidden">Status</span>
                  </Button>
                )}
                {canEdit && (
                  <Button
                    data-testid="edit-idea-btn"
                    onClick={() => navigate(`/ideas/edit/${idea.id}`)}
                    className="bg-blue-700 hover:bg-blue-800 text-sm"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                    Edit
                  </Button>
                )}
                {user?.role === 'admin' && (
                  <Button
                    data-testid="delete-idea-btn"
                    onClick={() => setShowDeleteDialog(true)}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 text-sm"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Eye-dea Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

        {/* Resubmit Button for Revision Requested */}
        {isOwner && idea.status === 'revision_requested' && (
          <Card className="bg-orange-50 border-orange-300 border-2 shadow-md">
            <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-orange-900 text-base sm:text-lg mb-1">Revision Requested</h3>
                    <p className="text-xs sm:text-sm text-orange-800 mb-2">
                      The approver has requested changes to your Eye-dea. Please review the comments below, 
                      make necessary updates using the Edit button, and then resubmit for review.
                    </p>
                    <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-orange-700">
                      <span className="font-semibold">Steps:</span>
                      <span>1. Review</span>
                      <span>→</span>
                      <span>2. Edit</span>
                      <span>→</span>
                      <span>3. Resubmit</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:self-end">
                  <Button
                    data-testid="edit-idea-from-revision-btn"
                    onClick={() => navigate(`/ideas/edit/${idea.id}`)}
                    variant="outline"
                    className="border-orange-600 text-orange-700 hover:bg-orange-100 text-sm"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Eye-dea
                  </Button>
                  <Button
                    data-testid="resubmit-btn"
                    onClick={handleResubmit}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md text-sm"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Resubmit for Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approver Actions */}
        {isApprover && idea.status === 'pending' && user.sub_role === 'approver' && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Approver Actions</CardTitle>
              <CardDescription className="text-sm">Review and take action on this Eye-dea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Comment (optional for approval)</label>
                <Textarea
                  data-testid="action-comment-input"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Add your feedback or comments..."
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  data-testid="approve-btn"
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-sm"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                  Approve
                </Button>
                <Button
                  data-testid="decline-btn"
                  onClick={handleDecline}
                  className="bg-red-600 hover:bg-red-700 text-sm"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1 sm:mr-2" />
                  Decline
                </Button>
                <Button
                  data-testid="request-revision-btn"
                  onClick={handleRequestRevision}
                  className="bg-orange-600 hover:bg-orange-700 text-sm"
                  size="sm"
                >
                  <AlertCircle className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Request Revision</span>
                  <span className="xs:hidden">Revision</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* C.I. Excellence Team Evaluation */}
        {user?.role === 'approver' && user?.sub_role === 'ci_excellence' && 
         (idea.status === 'approved' || idea.status === 'assigned_to_te' || idea.status === 'implemented' || idea.is_evaluated) && (
          <CIEvaluationPanel 
            idea={idea}
            onEvaluationComplete={fetchIdea}
          />
        )}

        {/* Comments */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Comments & Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No comments yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3 sm:p-4" data-testid={`comment-${comment.id}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{comment.username}</span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{comment.comment_text}</p>
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
                className="text-sm"
              />
              <Button
                data-testid="add-comment-btn"
                onClick={handleAddComment}
                className="mt-3 bg-blue-700 hover:bg-blue-800"
                size="sm"
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Status Dialog for C.I. Excellence Team */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Eye-dea Status</DialogTitle>
            <DialogDescription>
              Change the status of this Eye-dea assigned to Tech & Engineering
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger data-testid="status-select">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updatingStatus || !newStatus}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Eye-dea</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Eye-dea? This action cannot be undone and will also delete all associated comments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-semibold text-gray-900">{idea?.title}</p>
              <p className="text-sm text-gray-600 mt-1">{idea?.idea_number} • {idea?.pillar}</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteIdea}
              disabled={deleting}
              data-testid="confirm-delete-idea-btn"
            >
              {deleting ? 'Deleting...' : 'Delete Eye-dea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
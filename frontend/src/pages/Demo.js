import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Play, Pause, SkipForward, SkipBack, Download, ExternalLink,
  Lightbulb, CheckCircle, Clock, Award, TrendingUp, Star,
  DollarSign, Wrench, BarChart3, Trophy, Users, Zap, ChevronRight,
  Info, Eye, FileText, ArrowRight
} from 'lucide-react';

const STEPS = [
  {
    id: 1, title: 'User Dashboard', role: 'User',
    tooltip: 'Central hub for all idea metrics',
    description: 'The dashboard provides a real-time overview of all submitted ideas, status breakdowns, and the Eye-dea Champions Leaderboard.'
  },
  {
    id: 2, title: 'Create Idea', role: 'User',
    tooltip: 'Submit new improvement ideas',
    description: 'Users fill in the idea form with title, improvement type, current process, suggested solution, benefits, and optional file attachments.'
  },
  {
    id: 3, title: 'Submit Idea', role: 'User',
    tooltip: 'Idea enters approval pipeline',
    description: 'Once submitted, the idea is assigned an auto-generated number (EYE-00001) and routed to the designated approver for review.'
  },
  {
    id: 4, title: 'Approver Stage', role: 'Approver',
    tooltip: 'Approve, decline, or request revision',
    description: 'Approvers review submitted ideas and can approve them, decline them with reasons, or request revisions from the submitter.'
  },
  {
    id: 5, title: 'CI Excellence Team', role: 'CI Team',
    tooltip: 'Evaluate complexity and savings',
    description: 'The C.I. Excellence Team evaluates approved ideas for complexity level, quick win status, and estimated cost/time savings.'
  },
  {
    id: 6, title: 'CI Analysis Dashboard', role: 'CI Team',
    tooltip: 'Analytics for continuous improvement',
    description: 'A dedicated analytics dashboard showing complexity distribution, status breakdown, approval rates, and savings impact metrics.'
  },
  {
    id: 7, title: 'Not Quick Win Scenario', role: 'CI Team',
    tooltip: 'Complex ideas need deeper analysis',
    description: 'Ideas flagged as "Not Quick Win" are categorized by complexity (Low/Medium/High) and may be assigned to the Tech & Engineering team.'
  },
  {
    id: 8, title: 'Savings & Impact Display', role: 'CI Team',
    tooltip: 'Track financial and time impact',
    description: 'Verified cost savings and time saved are recorded with full audit history, tracking every change with date, reviewer, and reason.'
  },
  {
    id: 9, title: 'Assignment to T&E', role: 'CI Team',
    tooltip: 'Route to Tech & Engineering team',
    description: 'Complex ideas are assigned to T&E specialists for technical implementation, with status tracking throughout the process.'
  },
  {
    id: 10, title: 'Implementation Status', role: 'Admin',
    tooltip: 'Track idea through to completion',
    description: 'Ideas progress through statuses: Submitted, Approved, Assigned to T&E, and finally Implemented with verified savings.'
  },
  {
    id: 11, title: 'Eye-dea Champions', role: 'All Users',
    tooltip: 'Points-based contributor ranking',
    description: 'The leaderboard ranks contributors by points: Both Savings (5pts), Cost or Time (3pts), Quick Win (2pts), Submission (1pt).'
  },
  {
    id: 12, title: 'Best Eye-deas', role: 'CI Team',
    tooltip: 'Showcase top recognized ideas',
    description: 'The C.I. Excellence Team tags the best ideas, which are showcased on the dashboard and CI Analytics page for organization-wide visibility.'
  }
];

const ROLE_COLORS = {
  'User': 'bg-blue-100 text-blue-700',
  'Approver': 'bg-amber-100 text-amber-700',
  'CI Team': 'bg-purple-100 text-purple-700',
  'Admin': 'bg-emerald-100 text-emerald-700',
  'All Users': 'bg-gray-100 text-gray-700'
};

// Mock data for realistic demos
const MOCK_IDEAS = [
  { number: 'EYE-00042', title: 'Automate Monthly Billing Reconciliation', status: 'implemented', pillar: 'GBS', submitter: 'Maria Santos', savings: '$12,500', time: '8h 30m' },
  { number: 'EYE-00043', title: 'Streamline Vendor Onboarding Process', status: 'approved', pillar: 'Finance', submitter: 'James Cruz', savings: '$4,200', time: '3h 15m' },
  { number: 'EYE-00044', title: 'Digital Leave Request Workflow', status: 'pending', pillar: 'HR', submitter: 'Ana Reyes', savings: '', time: '' },
  { number: 'EYE-00045', title: 'Reduce Server Downtime with Auto-Scaling', status: 'assigned_to_te', pillar: 'Tech', submitter: 'Leo Garcia', savings: '$8,300', time: '12h' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Maria Santos', team: 'Allowance Billing', points: 42 },
  { rank: 2, name: 'James Cruz', team: 'Accounts Payable', points: 31 },
  { rank: 3, name: 'Ana Reyes', team: 'HR Operations', points: 24 },
  { rank: 4, name: 'Leo Garcia', team: 'Cloud Infra', points: 19 },
  { rank: 5, name: 'Sofia Lim', team: 'Payroll', points: 15 },
];

const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-700',
  'approved': 'bg-green-100 text-green-700',
  'implemented': 'bg-emerald-100 text-emerald-700',
  'assigned_to_te': 'bg-purple-100 text-purple-700',
  'declined': 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  'pending': 'Pending',
  'approved': 'Approved',
  'implemented': 'Implemented',
  'assigned_to_te': 'Assigned to T&E',
  'declined': 'Declined',
};

// ===== Step Content Components =====

function StepDashboard() {
  const stats = [
    { label: 'Total Eye-deas', value: 47, color: 'text-blue-600', icon: Lightbulb },
    { label: 'Pending Review', value: 8, color: 'text-yellow-600', icon: Clock },
    { label: 'Approved', value: 21, color: 'text-green-600', icon: CheckCircle },
    { label: 'Implemented', value: 14, color: 'text-emerald-600', icon: Award },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border p-3 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-gray-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-3">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">RECENT EYE-DEAS</h4>
          {MOCK_IDEAS.slice(0, 3).map((idea, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div>
                <span className="text-xs font-mono text-gray-400 mr-2">{idea.number}</span>
                <span className="text-xs font-medium text-gray-700">{idea.title.substring(0, 30)}...</span>
              </div>
              <Badge className={`text-[10px] ${STATUS_COLORS[idea.status]}`}>{STATUS_LABELS[idea.status]}</Badge>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-3">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">LEADERBOARD TOP 3</h4>
          {MOCK_LEADERBOARD.slice(0, 3).map((e, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>{e.rank}</span>
                <span className="text-xs font-medium">{e.name}</span>
              </div>
              <span className="text-xs font-bold text-purple-600">{e.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCreateIdea() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> New Eye-dea Form</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Idea Title *</label>
          <div className="h-8 bg-blue-50 border border-blue-200 rounded-lg px-2 flex items-center text-xs text-gray-700">Automate Monthly Billing Reconciliation</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Improvement Type</label>
          <div className="h-8 bg-gray-50 border rounded-lg px-2 flex items-center text-xs text-gray-700">Process Automation</div>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">Current Process *</label>
        <div className="h-14 bg-gray-50 border rounded-lg px-2 py-1 text-xs text-gray-600">Manual reconciliation takes 3 days every month-end. The team cross-references invoices against purchase orders...</div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">Suggested Solution *</label>
        <div className="h-14 bg-gray-50 border rounded-lg px-2 py-1 text-xs text-gray-600">Implement an automated matching system using existing ERP data to reduce reconciliation time to 4 hours...</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Pillar</label>
          <div className="h-8 bg-gray-50 border rounded-lg px-2 flex items-center text-xs">GBS</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Attachments</label>
          <div className="h-8 bg-gray-50 border rounded-lg px-2 flex items-center text-xs text-gray-400">process_flow.pdf (2.1 MB)</div>
        </div>
      </div>
    </div>
  );
}

function StepSubmitIdea() {
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h4 className="text-lg font-bold text-gray-800">Eye-dea Submitted Successfully!</h4>
      <div className="bg-white rounded-xl border p-4 max-w-sm w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-blue-600 font-bold">EYE-00042</span>
          <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Pending Review</Badge>
        </div>
        <h5 className="text-sm font-semibold mb-1">Automate Monthly Billing Reconciliation</h5>
        <p className="text-xs text-gray-500">Submitted by Maria Santos  |  GBS</p>
        <div className="mt-3 flex gap-2">
          <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Status</p>
            <p className="text-xs font-bold text-yellow-600">Pending</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Assigned To</p>
            <p className="text-xs font-bold text-gray-700">Approver Team</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ArrowRight className="w-3 h-3" /> Now enters the approval workflow
      </div>
    </div>
  );
}

function StepApprover() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-mono text-blue-600 font-bold">EYE-00042</span>
            <h4 className="text-sm font-bold mt-1">Automate Monthly Billing Reconciliation</h4>
            <p className="text-xs text-gray-500">By Maria Santos  |  GBS  |  Allowance Billing</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-700">Pending Review</Badge>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600">
          <strong>Suggested Solution:</strong> Implement an automated matching system using existing ERP data to reduce reconciliation time from 3 days to 4 hours.
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8 btn-press">
            <CheckCircle className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 text-xs h-8">
            Request Revision
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-300 text-xs h-8">
            Decline
          </Button>
        </div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-green-800">Idea Approved</p>
          <p className="text-[10px] text-green-600">Now routed to C.I. Excellence Team for evaluation</p>
        </div>
      </div>
    </div>
  );
}

function StepCITeam() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
        <Award className="w-4 h-4" /> C.I. Excellence Evaluation
      </h4>
      <div className="bg-purple-50 rounded-lg p-3">
        <span className="text-xs font-mono text-blue-600 font-bold">EYE-00042</span>
        <span className="text-xs text-gray-500 ml-2">Automate Monthly Billing Reconciliation</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Quick Win?</label>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-green-100 border-2 border-green-400 text-xs font-bold text-green-700">Yes</div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-400">No</div>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Complexity Level</label>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-green-100 border-2 border-green-400 text-xs font-bold text-green-700">Low</div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-400">Medium</div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-400">High</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Savings Type</label>
          <div className="h-8 bg-purple-50 border border-purple-200 rounded-lg px-2 flex items-center text-xs font-medium text-purple-700">Both Cost & Time</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">Estimated Cost Savings</label>
          <div className="h-8 bg-green-50 border border-green-200 rounded-lg px-2 flex items-center text-xs font-bold text-green-700">$12,500</div>
        </div>
      </div>
    </div>
  );
}

function StepCIDashboard() {
  const statusBars = [
    { label: 'Approved', value: 21, max: 47, color: 'bg-green-500' },
    { label: 'Implemented', value: 14, max: 47, color: 'bg-emerald-500' },
    { label: 'Pending', value: 8, max: 47, color: 'bg-yellow-500' },
    { label: 'Assigned T&E', value: 3, max: 47, color: 'bg-purple-500' },
    { label: 'Declined', value: 1, max: 47, color: 'bg-red-400' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <Zap className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-700">12</p>
          <p className="text-[10px] text-green-600">Quick Wins</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-700">$54,200</p>
          <p className="text-[10px] text-blue-600">Cost Savings</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-indigo-700">86h 15m</p>
          <p className="text-[10px] text-indigo-600">Time Saved</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-3">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">STATUS DISTRIBUTION</h4>
        {statusBars.map((bar, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] w-20 text-gray-600">{bar.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className={`${bar.color} h-4 rounded-full animate-slide-left`} style={{ width: `${(bar.value / bar.max) * 100}%`, animationDelay: `${i * 100}ms` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-700 w-6 text-right">{bar.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepNotQuickWin() {
  return (
    <div className="space-y-3">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-orange-600" />
          <h4 className="text-sm font-bold text-orange-800">Not Quick Win - Requires Deeper Analysis</h4>
        </div>
        <div className="bg-white rounded-lg p-3 mb-3">
          <span className="text-xs font-mono text-blue-600 font-bold">EYE-00045</span>
          <h5 className="text-sm font-semibold mt-1">Reduce Server Downtime with Auto-Scaling</h5>
          <p className="text-xs text-gray-500 mt-1">By Leo Garcia  |  Tech  |  Cloud Infra</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Complexity</p>
            <p className="text-xs font-bold text-red-600">High</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Quick Win</p>
            <p className="text-xs font-bold text-orange-600">No</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Est. Savings</p>
            <p className="text-xs font-bold text-green-600">$8,300</p>
          </div>
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <Wrench className="w-5 h-5 text-purple-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-purple-800">Requires T&E Assignment</p>
          <p className="text-[10px] text-purple-600">High complexity ideas are routed to technical specialists</p>
        </div>
      </div>
    </div>
  );
}

function StepSavings() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <DollarSign className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-700">$12,500</p>
          <p className="text-[10px] text-green-600">Verified Cost Savings</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <Clock className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-700">8h 30m</p>
          <p className="text-[10px] text-blue-600">Time Saved Per Cycle</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-3">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">AUDIT HISTORY</h4>
        <div className="space-y-2">
          {[
            { date: 'Jan 15, 2026', user: 'CI Team Lead', reason: 'Initial evaluation', cost: '$10,000', time: '6h' },
            { date: 'Jan 22, 2026', user: 'CI Team Lead', reason: 'Updated after implementation review', cost: '$12,500', time: '8h 30m' },
          ].map((entry, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">{entry.date}</span>
                <span className="text-gray-500">by {entry.user}</span>
              </div>
              <p className="text-gray-500 text-[10px] mb-1">{entry.reason}</p>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">{entry.cost}</span>
                <span className="text-blue-600 font-bold">{entry.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepAssignTE() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-bold text-gray-800">T&E Assignment</h4>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-mono text-blue-600 font-bold">EYE-00045</span>
              <p className="text-sm font-semibold mt-1">Reduce Server Downtime with Auto-Scaling</p>
            </div>
            <Badge className="bg-purple-100 text-purple-700">Assigned to T&E</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">Assigned T&E Person</label>
            <div className="h-8 bg-gray-50 border rounded-lg px-2 flex items-center text-xs font-medium">Carlos Rivera - Cloud Specialist</div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">Target Completion</label>
            <div className="h-8 bg-gray-50 border rounded-lg px-2 flex items-center text-xs">March 15, 2026</div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-blue-700 mb-2">WORKFLOW PROGRESS</h4>
        <div className="flex items-center gap-1">
          {['Submitted', 'Approved', 'Evaluated', 'Assigned T&E', 'Implemented'].map((step, i) => (
            <React.Fragment key={i}>
              <div className={`px-2 py-1 rounded text-[9px] font-bold ${i <= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{step}</div>
              {i < 4 && <ChevronRight className={`w-3 h-3 ${i < 3 ? 'text-blue-600' : 'text-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepImplementation() {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Implementation Complete</h4>
            <p className="text-[10px] text-emerald-600">Idea successfully implemented and verified</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-blue-600 font-bold">EYE-00042</span>
            <Badge className="bg-emerald-100 text-emerald-700">Implemented</Badge>
          </div>
          <h5 className="text-sm font-semibold">Automate Monthly Billing Reconciliation</h5>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-blue-700 mb-2">FULL WORKFLOW</h4>
        <div className="flex items-center gap-1">
          {['Submitted', 'Approved', 'Evaluated', 'Assigned T&E', 'Implemented'].map((step, i) => (
            <React.Fragment key={i}>
              <div className="px-2 py-1 rounded text-[9px] font-bold bg-emerald-600 text-white">{step}</div>
              {i < 4 && <ChevronRight className="w-3 h-3 text-emerald-600" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-green-700">$12,500</p>
          <p className="text-[10px] text-gray-500">Cost Savings Verified</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-blue-700">8h 30m</p>
          <p className="text-[10px] text-gray-500">Time Saved Per Cycle</p>
        </div>
      </div>
    </div>
  );
}

function StepLeaderboard() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-300" />
          <div>
            <h4 className="text-white font-bold text-base">Eye-dea Champions</h4>
            <p className="text-purple-200 text-[10px]">Points-based contributor ranking</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">5</span> Both Savings</div>
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">3</span> Cost or Time</div>
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[8px] font-bold">2</span> Quick Win</div>
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[8px] font-bold">1</span> Submission</div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-500 w-12">RANK</th>
              <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-500">NAME</th>
              <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-500">TEAM</th>
              <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-500 w-16">POINTS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((e, i) => (
              <tr key={i} className="border-b last:border-0 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <td className="py-2 px-3">
                  <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-600'}`}>{e.rank}</span>
                </td>
                <td className="py-2 px-3 font-medium text-gray-800">{e.name}</td>
                <td className="py-2 px-3 text-gray-500 text-[10px]">{e.team}</td>
                <td className="py-2 px-3 text-right"><span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full">{e.points}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepBestIdeas() {
  const bestIdeas = [
    { number: 'EYE-00042', title: 'Automate Monthly Billing Reconciliation', submitter: 'Maria Santos', pillar: 'GBS', savings: '$12,500' },
    { number: 'EYE-00038', title: 'Paperless Vendor Invoice Processing', submitter: 'James Cruz', pillar: 'Finance', savings: '$9,800' },
    { number: 'EYE-00031', title: 'Automated Leave Balance Alerts', submitter: 'Ana Reyes', pillar: 'HR', savings: '$3,200' },
  ];
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Star className="w-6 h-6 text-yellow-500" />
          <div>
            <h4 className="text-base font-bold text-yellow-800">Best Eye-deas</h4>
            <p className="text-[10px] text-yellow-600">Top ideas recognized by C.I. Excellence Team</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {bestIdeas.map((idea, i) => (
            <div key={i} className="bg-white rounded-lg border border-yellow-200 p-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-yellow-500 text-white text-[10px]">Best Eye-dea</Badge>
                  <span className="text-[10px] font-mono text-gray-400">{idea.number}</span>
                </div>
                <h5 className="text-xs font-semibold text-gray-800">{idea.title}</h5>
                <p className="text-[10px] text-gray-500">{idea.submitter} | {idea.pillar}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{idea.savings}</p>
                <p className="text-[10px] text-gray-400">savings</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STEP_COMPONENTS = [
  StepDashboard, StepCreateIdea, StepSubmitIdea, StepApprover,
  StepCITeam, StepCIDashboard, StepNotQuickWin, StepSavings,
  StepAssignTE, StepImplementation, StepLeaderboard, StepBestIdeas
];

// ===== Main Demo Component =====

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const intervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const demoAreaRef = useRef(null);

  const step = STEPS[currentStep];
  const StepContent = STEP_COMPONENTS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goNext = useCallback(() => {
    setCurrentStep(prev => {
      if (prev >= STEPS.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const goPrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(goNext, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, goNext]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const startRecording = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setIsPlaying(true);
      setCurrentStep(0);

      // Capture frames
      const captureFrame = () => {
        if (!demoAreaRef.current || recorder.state !== 'recording') return;
        import('html2canvas').then(mod => {
          mod.default(demoAreaRef.current, { scale: 1, width: 1280, height: 720 }).then(c => {
            ctx.drawImage(c, 0, 0, 1280, 720);
          });
        }).catch(() => {});
      };
      const frameInterval = setInterval(captureFrame, 1000);
      setTimeout(() => {
        clearInterval(frameInterval);
        if (recorder.state === 'recording') recorder.stop();
        setIsPlaying(false);
      }, STEPS.length * 5000 + 2000);
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/eyedea-logo.png" alt="Eye" className="w-8 h-8" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
            <span className="text-xl font-extrabold text-white tracking-tight">DEA</span>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[10px] ml-2">LIVE DEMO</Badge>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://ideahub-297.emergent.host/login" target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm h-9 btn-press" data-testid="try-demo-btn">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Try Demo
              </Button>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Interactive Demo Walkthrough
          </h1>
          <p className="text-blue-300/80 max-w-xl mx-auto text-sm">
            Experience the complete Eye-DEA workflow — from idea submission to implementation and recognition.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                  i === currentStep
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : i < currentStep
                    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-400'
                }`}
                data-testid={`demo-step-${i}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  i === currentStep ? 'bg-white text-blue-600' : i < currentStep ? 'bg-blue-400/30 text-blue-300' : 'bg-white/10 text-gray-500'
                }`}>{s.id}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-500">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-[10px] text-gray-500">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Main Demo Area */}
        <div ref={demoAreaRef} className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden" data-testid="demo-area">
          {/* Step Header */}
          <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-400">{step.id}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{step.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[10px] ${ROLE_COLORS[step.role]}`}>{step.role}</Badge>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-blue-400/60 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-48 bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl border border-white/10">
                      {step.tooltip}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Description */}
          <div className="px-6 py-3 border-b border-white/5">
            <p className="text-xs text-blue-200/60">{step.description}</p>
          </div>

          {/* Step Content */}
          <div className="p-6" key={currentStep}>
            <div className="animate-scale-in">
              <StepContent />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={currentStep === 0} className="border-white/20 text-gray-300 hover:bg-white/10 h-9" data-testid="demo-prev-btn">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={togglePlay} className={`h-9 min-w-[120px] btn-press ${isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`} data-testid="demo-play-btn">
              {isPlaying ? <><Pause className="w-4 h-4 mr-1.5" /> Pause</> : <><Play className="w-4 h-4 mr-1.5" /> Auto Play</>}
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={currentStep === STEPS.length - 1} className="border-white/20 text-gray-300 hover:bg-white/10 h-9" data-testid="demo-next-btn">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isRecording && !recordedUrl && (
              <Button variant="outline" size="sm" onClick={startRecording} className="border-white/20 text-gray-300 hover:bg-white/10 h-9 text-xs" data-testid="record-demo-btn">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Record Walkthrough
              </Button>
            )}
            {isRecording && (
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 animate-pulse">Recording...</Badge>
            )}
            {recordedUrl && (
              <a href={recordedUrl} download="eyedea-demo.webm">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9 text-xs btn-press" data-testid="download-video-btn">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Demo Video
                </Button>
              </a>
            )}
            <a href="https://ideahub-297.emergent.host/login" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-9 text-xs btn-press" data-testid="try-demo-bottom-btn">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Try Demo
              </Button>
            </a>
          </div>
        </div>

        {/* Step Quick Nav */}
        <div className="mt-10 mb-6">
          <h3 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-wider">All Demo Steps</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
                className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                  i === currentStep
                    ? 'bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-600/10'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === currentStep ? 'bg-blue-500 text-white' : i < currentStep ? 'bg-blue-400/20 text-blue-400' : 'bg-white/10 text-gray-500'
                  }`}>{s.id}</span>
                  <Badge className={`text-[9px] ${ROLE_COLORS[s.role]}`}>{s.role}</Badge>
                </div>
                <h4 className={`text-xs font-semibold ${i === currentStep ? 'text-white' : 'text-gray-400'}`}>{s.title}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.tooltip}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

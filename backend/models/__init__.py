"""
Pydantic models for the Philtech Eye-dea application.
These models define the data structures used throughout the application.
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional


# ==================== USER MODELS ====================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "user"  # user, approver, admin
    sub_role: Optional[str] = None  # For approver: "approver" or "ci_excellence"
    can_change_subrole: Optional[bool] = True  # Admin toggle to hide sub-role change control
    department: Optional[str] = None
    team: Optional[str] = None
    pillar: Optional[str] = None
    manager: Optional[str] = None
    approved_pillars: Optional[List[str]] = []
    approved_departments: Optional[List[str]] = []


class UserCreate(UserBase):
    password: str


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class SubRoleSelection(BaseModel):
    sub_role: str  # "approver" or "ci_excellence"


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


# ==================== IDEA MODELS ====================

class IdeaBase(BaseModel):
    pillar: str
    title: str
    improvement_type: str
    current_process: str
    suggested_solution: str
    benefits: str
    target_completion: str
    department: Optional[str] = None
    team: Optional[str] = None


class IdeaCreate(IdeaBase):
    pass


class CIEvaluation(BaseModel):
    is_quick_win: bool
    complexity_level: Optional[str] = None  # Low, Medium, High
    savings_type: Optional[str] = None  # cost_savings, time_saved
    cost_savings: Optional[float] = None
    time_saved_hours: Optional[float] = None
    time_saved_minutes: Optional[float] = None
    evaluation_notes: Optional[str] = None
    assigned_to_tech: Optional[bool] = False
    tech_person_name: Optional[str] = None


class BestIdeaSelection(BaseModel):
    idea_id: str
    is_best_idea: bool


class Idea(IdeaBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    idea_number: str
    status: str  # draft, pending, approved, declined, revision_requested
    submitted_by: str
    submitted_by_username: str
    assigned_approver: Optional[str] = None
    assigned_approver_username: Optional[str] = None
    created_at: str
    updated_at: str
    # C.I. Excellence Team Evaluation fields
    is_quick_win: Optional[bool] = None
    complexity_level: Optional[str] = None
    savings_type: Optional[str] = None
    cost_savings: Optional[float] = None
    time_saved_hours: Optional[float] = None
    time_saved_minutes: Optional[float] = None
    evaluation_notes: Optional[str] = None
    assigned_to_tech: Optional[bool] = False
    tech_person_name: Optional[str] = None
    is_best_idea: Optional[bool] = False
    evaluated_by: Optional[str] = None
    evaluated_by_username: Optional[str] = None
    evaluated_at: Optional[str] = None
    is_evaluated: Optional[bool] = False


class IdeaAction(BaseModel):
    comment: Optional[str] = None


class CIStatusUpdate(BaseModel):
    new_status: str  # implemented, revision_requested, declined


class SavingsUpdate(BaseModel):
    savings_type: Optional[str] = None  # cost_savings or time_saved
    cost_savings: Optional[float] = None
    time_saved_hours: Optional[int] = None
    time_saved_minutes: Optional[int] = None


# ==================== COMMENT MODELS ====================

class CommentBase(BaseModel):
    comment_text: str


class Comment(CommentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    idea_id: str
    user_id: str
    username: str
    created_at: str


# ==================== ORGANIZATION MODELS ====================

class DepartmentBase(BaseModel):
    name: str
    pillar: str


class Department(DepartmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str


class PillarBase(BaseModel):
    name: str


class Pillar(PillarBase):
    model_config = ConfigDict(extra="ignore")
    id: str


class TeamBase(BaseModel):
    name: str
    pillar: str
    department: str


class Team(TeamBase):
    model_config = ConfigDict(extra="ignore")
    id: str


class TechPersonBase(BaseModel):
    name: str
    email: Optional[str] = None
    specialization: Optional[str] = None


class TechPerson(TechPersonBase):
    model_config = ConfigDict(extra="ignore")
    id: str


# ==================== MANAGER MODELS ====================

class ManagerBase(BaseModel):
    name: str
    email: Optional[str] = None
    pillar: str
    department: str
    team: str
    is_active: Optional[bool] = True


class Manager(ManagerBase):
    model_config = ConfigDict(extra="ignore")
    id: str


# ==================== DASHBOARD MODELS ====================

class DashboardStats(BaseModel):
    total_ideas: int
    pending_ideas: int
    approved_ideas: int
    declined_ideas: int
    revision_requested_ideas: int
    implemented_ideas: int
    assigned_to_te_ideas: int
    my_ideas: int
    best_idea: Optional[dict] = None

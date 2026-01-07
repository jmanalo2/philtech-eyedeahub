from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Resend Email
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"  # user, approver, admin
    department: Optional[str] = None
    team: Optional[str] = None

class UserCreate(UserBase):
    password: str

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

class CommentBase(BaseModel):
    comment_text: str

class Comment(CommentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    idea_id: str
    user_id: str
    username: str
    created_at: str

class IdeaAction(BaseModel):
    comment: Optional[str] = None

class DepartmentBase(BaseModel):
    name: str

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

class Team(TeamBase):
    model_config = ConfigDict(extra="ignore")
    id: str

class DashboardStats(BaseModel):
    total_ideas: int
    pending_ideas: int
    approved_ideas: int
    declined_ideas: int
    revision_requested_ideas: int
    my_ideas: int

# ==================== UTILITIES ====================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def send_email_async(recipient_email: str, subject: str, html_content: str):
    if not RESEND_API_KEY:
        logging.warning(f"Email not sent (no API key): {subject} to {recipient_email}")
        return
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent: {subject} to {recipient_email}")
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")

async def generate_idea_number() -> str:
    count = await db.ideas.count_documents({})
    return f"EYE-{str(count + 1).zfill(5)}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = f"user_{datetime.now(timezone.utc).timestamp()}"
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "role": user_data.role,
        "department": user_data.department,
        "team": user_data.team,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash")
    return User(**user_doc)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = create_access_token(data={"sub": user["id"]})
    user.pop("password_hash")
    return TokenResponse(access_token=token, token_type="bearer", user=User(**user))

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ==================== IDEAS ROUTES ====================

@api_router.get("/ideas", response_model=List[Idea])
async def get_ideas(
    status: Optional[str] = None,
    pillar: Optional[str] = None,
    department: Optional[str] = None,
    team: Optional[str] = None,
    submitted_by: Optional[str] = None,
    assigned_approver: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if pillar:
        query["pillar"] = pillar
    if department:
        query["department"] = department
    if team:
        query["team"] = team
    if submitted_by:
        query["submitted_by"] = submitted_by
    if assigned_approver:
        query["assigned_approver"] = assigned_approver
    
    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Idea(**idea) for idea in ideas]

@api_router.post("/ideas", response_model=Idea)
async def create_idea(idea_data: IdeaCreate, current_user: dict = Depends(get_current_user)):
    idea_number = await generate_idea_number()
    idea_id = f"idea_{datetime.now(timezone.utc).timestamp()}"
    
    # Find approver for this pillar/department
    approver = await db.users.find_one({
        "role": "approver",
        "department": idea_data.department
    }, {"_id": 0})
    
    idea_doc = {
        "id": idea_id,
        "idea_number": idea_number,
        "pillar": idea_data.pillar,
        "title": idea_data.title,
        "improvement_type": idea_data.improvement_type,
        "current_process": idea_data.current_process,
        "suggested_solution": idea_data.suggested_solution,
        "benefits": idea_data.benefits,
        "target_completion": idea_data.target_completion,
        "department": idea_data.department,
        "team": idea_data.team,
        "status": "pending",
        "submitted_by": current_user["id"],
        "submitted_by_username": current_user["username"],
        "assigned_approver": approver["id"] if approver else None,
        "assigned_approver_username": approver["username"] if approver else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ideas.insert_one(idea_doc)
    
    # Send email to approver
    if approver:
        html = f"""
        <html>
            <body>
                <h2>New Eye-dea Submitted for Approval</h2>
                <p><strong>Idea Number:</strong> {idea_number}</p>
                <p><strong>Title:</strong> {idea_data.title}</p>
                <p><strong>Submitted By:</strong> {current_user['username']}</p>
                <p><strong>Pillar:</strong> {idea_data.pillar}</p>
                <p><strong>Department:</strong> {idea_data.department}</p>
                <p>Please review and approve/decline this Eye-dea.</p>
            </body>
        </html>
        """
        asyncio.create_task(send_email_async(approver["email"], f"New Eye-dea: {idea_data.title}", html))
    
    return Idea(**idea_doc)

@api_router.get("/ideas/{idea_id}", response_model=Idea)
async def get_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return Idea(**idea)

@api_router.put("/ideas/{idea_id}", response_model=Idea)
async def update_idea(idea_id: str, idea_data: IdeaCreate, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    if idea["submitted_by"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this idea")
    
    update_doc = {
        "pillar": idea_data.pillar,
        "title": idea_data.title,
        "improvement_type": idea_data.improvement_type,
        "current_process": idea_data.current_process,
        "suggested_solution": idea_data.suggested_solution,
        "benefits": idea_data.benefits,
        "target_completion": idea_data.target_completion,
        "department": idea_data.department,
        "team": idea_data.team,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ideas.update_one({"id": idea_id}, {"$set": update_doc})
    updated_idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    return Idea(**updated_idea)

@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.ideas.delete_one({"id": idea_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    await db.comments.delete_many({"idea_id": idea_id})
    return {"message": "Idea deleted successfully"}

@api_router.post("/ideas/{idea_id}/approve")
async def approve_idea(idea_id: str, action: IdeaAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["approver", "admin"]:
        raise HTTPException(status_code=403, detail="Only approvers can approve ideas")
    
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    await db.ideas.update_one(
        {"id": idea_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if action.comment:
        comment_id = f"comment_{datetime.now(timezone.utc).timestamp()}"
        await db.comments.insert_one({
            "id": comment_id,
            "idea_id": idea_id,
            "user_id": current_user["id"],
            "username": current_user["username"],
            "comment_text": action.comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Send email to submitter
    submitter = await db.users.find_one({"id": idea["submitted_by"]}, {"_id": 0})
    if submitter:
        html = f"""
        <html>
            <body>
                <h2>Your Eye-dea Has Been Approved!</h2>
                <p><strong>Idea Number:</strong> {idea['idea_number']}</p>
                <p><strong>Title:</strong> {idea['title']}</p>
                <p><strong>Approved By:</strong> {current_user['username']}</p>
                {f'<p><strong>Comment:</strong> {action.comment}</p>' if action.comment else ''}
            </body>
        </html>
        """
        asyncio.create_task(send_email_async(submitter["email"], f"Eye-dea Approved: {idea['title']}", html))
    
    return {"message": "Idea approved successfully"}

@api_router.post("/ideas/{idea_id}/decline")
async def decline_idea(idea_id: str, action: IdeaAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["approver", "admin"]:
        raise HTTPException(status_code=403, detail="Only approvers can decline ideas")
    
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    await db.ideas.update_one(
        {"id": idea_id},
        {"$set": {"status": "declined", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if action.comment:
        comment_id = f"comment_{datetime.now(timezone.utc).timestamp()}"
        await db.comments.insert_one({
            "id": comment_id,
            "idea_id": idea_id,
            "user_id": current_user["id"],
            "username": current_user["username"],
            "comment_text": action.comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Send email to submitter
    submitter = await db.users.find_one({"id": idea["submitted_by"]}, {"_id": 0})
    if submitter:
        html = f"""
        <html>
            <body>
                <h2>Your Eye-dea Has Been Declined</h2>
                <p><strong>Idea Number:</strong> {idea['idea_number']}</p>
                <p><strong>Title:</strong> {idea['title']}</p>
                <p><strong>Declined By:</strong> {current_user['username']}</p>
                {f'<p><strong>Comment:</strong> {action.comment}</p>' if action.comment else ''}
            </body>
        </html>
        """
        asyncio.create_task(send_email_async(submitter["email"], f"Eye-dea Declined: {idea['title']}", html))
    
    return {"message": "Idea declined successfully"}

@api_router.post("/ideas/{idea_id}/request-revision")
async def request_revision(idea_id: str, action: IdeaAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["approver", "admin"]:
        raise HTTPException(status_code=403, detail="Only approvers can request revisions")
    
    if not action.comment:
        raise HTTPException(status_code=400, detail="Comment is required for revision requests")
    
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    await db.ideas.update_one(
        {"id": idea_id},
        {"$set": {"status": "revision_requested", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    comment_id = f"comment_{datetime.now(timezone.utc).timestamp()}"
    await db.comments.insert_one({
        "id": comment_id,
        "idea_id": idea_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "comment_text": action.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email to submitter
    submitter = await db.users.find_one({"id": idea["submitted_by"]}, {"_id": 0})
    if submitter:
        html = f"""
        <html>
            <body>
                <h2>Revision Requested for Your Eye-dea</h2>
                <p><strong>Idea Number:</strong> {idea['idea_number']}</p>
                <p><strong>Title:</strong> {idea['title']}</p>
                <p><strong>Requested By:</strong> {current_user['username']}</p>
                <p><strong>Comment:</strong> {action.comment}</p>
                <p>Please revise and resubmit your Eye-dea.</p>
            </body>
        </html>
        """
        asyncio.create_task(send_email_async(submitter["email"], f"Revision Requested: {idea['title']}", html))
    
    return {"message": "Revision requested successfully"}

@api_router.post("/ideas/{idea_id}/resubmit")
async def resubmit_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    if idea["submitted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to resubmit this idea")
    
    await db.ideas.update_one(
        {"id": idea_id},
        {"$set": {"status": "pending", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send email to approver
    if idea["assigned_approver"]:
        approver = await db.users.find_one({"id": idea["assigned_approver"]}, {"_id": 0})
        if approver:
            html = f"""
            <html>
                <body>
                    <h2>Eye-dea Resubmitted for Review</h2>
                    <p><strong>Idea Number:</strong> {idea['idea_number']}</p>
                    <p><strong>Title:</strong> {idea['title']}</p>
                    <p><strong>Submitted By:</strong> {current_user['username']}</p>
                    <p>This Eye-dea has been revised and resubmitted for your review.</p>
                </body>
            </html>
            """
            asyncio.create_task(send_email_async(approver["email"], f"Eye-dea Resubmitted: {idea['title']}", html))
    
    return {"message": "Idea resubmitted successfully"}

@api_router.get("/ideas/{idea_id}/comments", response_model=List[Comment])
async def get_comments(idea_id: str, current_user: dict = Depends(get_current_user)):
    comments = await db.comments.find({"idea_id": idea_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return [Comment(**comment) for comment in comments]

@api_router.post("/ideas/{idea_id}/comments", response_model=Comment)
async def add_comment(idea_id: str, comment_data: CommentBase, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    comment_id = f"comment_{datetime.now(timezone.utc).timestamp()}"
    comment_doc = {
        "id": comment_id,
        "idea_id": idea_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "comment_text": comment_data.comment_text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    return Comment(**comment_doc)

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total = await db.ideas.count_documents({})
    pending = await db.ideas.count_documents({"status": "pending"})
    approved = await db.ideas.count_documents({"status": "approved"})
    declined = await db.ideas.count_documents({"status": "declined"})
    revision = await db.ideas.count_documents({"status": "revision_requested"})
    my_ideas = await db.ideas.count_documents({"submitted_by": current_user["id"]})
    
    return DashboardStats(
        total_ideas=total,
        pending_ideas=pending,
        approved_ideas=approved,
        declined_ideas=declined,
        revision_requested_ideas=revision,
        my_ideas=my_ideas
    )

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserBase, current_user: dict = Depends(get_admin_user)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "username": user_data.username,
            "email": user_data.email,
            "role": user_data.role,
            "department": user_data.department,
            "team": user_data.team
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return User(**updated_user)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.get("/admin/departments", response_model=List[Department])
async def get_departments(current_user: dict = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    return [Department(**dept) for dept in departments]

@api_router.post("/admin/departments", response_model=Department)
async def create_department(dept_data: DepartmentBase, current_user: dict = Depends(get_admin_user)):
    dept_id = f"dept_{datetime.now(timezone.utc).timestamp()}"
    dept_doc = {"id": dept_id, "name": dept_data.name}
    await db.departments.insert_one(dept_doc)
    return Department(**dept_doc)

@api_router.delete("/admin/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.departments.delete_one({"id": dept_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}

@api_router.get("/admin/pillars", response_model=List[Pillar])
async def get_pillars(current_user: dict = Depends(get_current_user)):
    pillars = await db.pillars.find({}, {"_id": 0}).to_list(1000)
    return [Pillar(**pillar) for pillar in pillars]

@api_router.post("/admin/pillars", response_model=Pillar)
async def create_pillar(pillar_data: PillarBase, current_user: dict = Depends(get_admin_user)):
    pillar_id = f"pillar_{datetime.now(timezone.utc).timestamp()}"
    pillar_doc = {"id": pillar_id, "name": pillar_data.name}
    await db.pillars.insert_one(pillar_doc)
    return Pillar(**pillar_doc)

@api_router.delete("/admin/pillars/{pillar_id}")
async def delete_pillar(pillar_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.pillars.delete_one({"id": pillar_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pillar not found")
    return {"message": "Pillar deleted successfully"}

@api_router.get("/admin/teams", response_model=List[Team])
async def get_teams(pillar: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"pillar": pillar} if pillar else {}
    teams = await db.teams.find(query, {"_id": 0}).to_list(1000)
    return [Team(**team) for team in teams]

@api_router.post("/admin/teams", response_model=Team)
async def create_team(team_data: TeamBase, current_user: dict = Depends(get_admin_user)):
    team_id = f"team_{datetime.now(timezone.utc).timestamp()}"
    team_doc = {"id": team_id, "name": team_data.name, "pillar": team_data.pillar}
    await db.teams.insert_one(team_doc)
    return Team(**team_doc)

@api_router.delete("/admin/teams/{team_id}")
async def delete_team(team_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}

# ==================== SEED DATA ====================

@api_router.post("/admin/seed-data")
async def seed_data(current_user: dict = Depends(get_admin_user)):
    # Check if already seeded
    existing_pillars = await db.pillars.count_documents({})
    if existing_pillars > 0:
        return {"message": "Data already seeded"}
    
    # Seed pillars
    pillars = ["GBS", "Tech", "Finance", "HR"]
    for pillar_name in pillars:
        pillar_id = f"pillar_{datetime.now(timezone.utc).timestamp()}_{pillar_name}"
        await db.pillars.insert_one({"id": pillar_id, "name": pillar_name})
    
    # Seed teams
    teams = [
        {"name": "Allowance Billing", "pillar": "GBS"},
        {"name": "Pre-audit and AB", "pillar": "GBS"}
    ]
    for team in teams:
        team_id = f"team_{datetime.now(timezone.utc).timestamp()}_{team['name']}"
        await db.teams.insert_one({"id": team_id, "name": team["name"], "pillar": team["pillar"]})
    
    # Seed departments
    departments = ["Operations", "Technology", "Finance", "Human Resources"]
    for dept_name in departments:
        dept_id = f"dept_{datetime.now(timezone.utc).timestamp()}_{dept_name}"
        await db.departments.insert_one({"id": dept_id, "name": dept_name})
    
    # Seed sample users
    sample_users = [
        {"username": "admin", "email": "admin@philtech.com", "password": "admin123", "role": "admin", "department": "Operations"},
        {"username": "approver1", "email": "approver1@philtech.com", "password": "approver123", "role": "approver", "department": "Operations"},
        {"username": "user1", "email": "user1@philtech.com", "password": "user123", "role": "user", "department": "Operations", "team": "Allowance Billing"}
    ]
    
    for user_data in sample_users:
        user_id = f"user_{datetime.now(timezone.utc).timestamp()}_{user_data['username']}"
        await db.users.insert_one({
            "id": user_id,
            "username": user_data["username"],
            "email": user_data["email"],
            "password_hash": get_password_hash(user_data["password"]),
            "role": user_data["role"],
            "department": user_data["department"],
            "team": user_data.get("team"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Seed sample ideas
    approver_user = await db.users.find_one({"role": "approver"}, {"_id": 0})
    regular_user = await db.users.find_one({"role": "user"}, {"_id": 0})
    
    if approver_user and regular_user:
        sample_ideas = [
            {
                "title": "Automate Invoice Processing",
                "pillar": "GBS",
                "improvement_type": "Automation",
                "current_process": "Manual invoice data entry and validation",
                "suggested_solution": "Implement OCR and AI-powered invoice processing system",
                "benefits": "Reduce processing time by 70% and eliminate manual errors",
                "target_completion": "Q2 2025",
                "department": "Operations",
                "team": "Allowance Billing",
                "status": "pending"
            },
            {
                "title": "Standardize Approval Workflows",
                "pillar": "Tech",
                "improvement_type": "Standardization",
                "current_process": "Different approval processes across departments",
                "suggested_solution": "Create unified approval workflow system",
                "benefits": "Improve consistency and reduce approval time by 40%",
                "target_completion": "Q3 2025",
                "department": "Technology",
                "team": None,
                "status": "approved"
            }
        ]
        
        for idea_data in sample_ideas:
            idea_number = await generate_idea_number()
            idea_id = f"idea_{datetime.now(timezone.utc).timestamp()}_{idea_data['title']}"
            await db.ideas.insert_one({
                "id": idea_id,
                "idea_number": idea_number,
                "pillar": idea_data["pillar"],
                "title": idea_data["title"],
                "improvement_type": idea_data["improvement_type"],
                "current_process": idea_data["current_process"],
                "suggested_solution": idea_data["suggested_solution"],
                "benefits": idea_data["benefits"],
                "target_completion": idea_data["target_completion"],
                "department": idea_data["department"],
                "team": idea_data["team"],
                "status": idea_data["status"],
                "submitted_by": regular_user["id"],
                "submitted_by_username": regular_user["username"],
                "assigned_approver": approver_user["id"],
                "assigned_approver_username": approver_user["username"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    
    return {"message": "Sample data seeded successfully"}

# ==================== APP INITIALIZATION ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
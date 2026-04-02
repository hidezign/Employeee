from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    salary: float
    position: str

class LeaveRequest(BaseModel):
    start_date: str
    end_date: str
    reason: str

class LeaveAction(BaseModel):
    status: str

@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    email = request.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(request.password)
    user_doc = {
        "email": email,
        "name": request.name,
        "password_hash": hashed,
        "role": "employee",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "employee")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "_id": user_id,
        "email": email,
        "name": request.name,
        "role": "employee"
    }

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "salary": user.get("salary"),
        "position": user.get("position")
    }

@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/employees")
async def create_employee(employee: EmployeeCreate, admin: dict = Depends(require_admin)):
    email = employee.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    default_password = "employee123"
    hashed = hash_password(default_password)
    
    user_doc = {
        "email": email,
        "name": employee.name,
        "password_hash": hashed,
        "role": "employee",
        "salary": employee.salary,
        "position": employee.position,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    
    return {
        "_id": str(result.inserted_id),
        "email": email,
        "name": employee.name,
        "role": "employee",
        "salary": employee.salary,
        "position": employee.position
    }

@api_router.get("/employees")
async def get_employees(admin: dict = Depends(require_admin)):
    users = await db.users.find({"role": "employee"}, {"_id": 1, "name": 1, "email": 1, "salary": 1, "position": 1, "created_at": 1}).to_list(1000)
    for user in users:
        user["_id"] = str(user["_id"])
    return users

@api_router.post("/attendance/checkin")
async def checkin(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    existing = await db.attendance.find_one({"user_id": user["_id"], "date": today})
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    attendance_doc = {
        "user_id": user["_id"],
        "user_name": user["name"],
        "date": today,
        "checkin_time": datetime.now(timezone.utc).isoformat(),
        "checkout_time": None
    }
    result = await db.attendance.insert_one(attendance_doc)
    attendance_doc["_id"] = str(result.inserted_id)
    return attendance_doc

@api_router.post("/attendance/checkout")
async def checkout(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    existing = await db.attendance.find_one({"user_id": user["_id"], "date": today})
    if not existing:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    if existing.get("checkout_time"):
        raise HTTPException(status_code=400, detail="Already checked out today")
    
    await db.attendance.update_one(
        {"_id": existing["_id"]},
        {"$set": {"checkout_time": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.attendance.find_one({"_id": existing["_id"]})
    updated["_id"] = str(updated["_id"])
    return updated

@api_router.get("/attendance")
async def get_all_attendance(admin: dict = Depends(require_admin)):
    records = await db.attendance.find({}, {"_id": 1, "user_name": 1, "date": 1, "checkin_time": 1, "checkout_time": 1}).sort("date", -1).to_list(1000)
    for record in records:
        record["_id"] = str(record["_id"])
    return records

@api_router.get("/attendance/me")
async def get_my_attendance(user: dict = Depends(get_current_user)):
    records = await db.attendance.find({"user_id": user["_id"]}, {"_id": 1, "date": 1, "checkin_time": 1, "checkout_time": 1}).sort("date", -1).to_list(100)
    for record in records:
        record["_id"] = str(record["_id"])
    return records

@api_router.post("/leaves")
async def apply_leave(leave: LeaveRequest, user: dict = Depends(get_current_user)):
    leave_doc = {
        "user_id": user["_id"],
        "user_name": user["name"],
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "reason": leave.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.leaves.insert_one(leave_doc)
    leave_doc["_id"] = str(result.inserted_id)
    return leave_doc

@api_router.get("/leaves/me")
async def get_my_leaves(user: dict = Depends(get_current_user)):
    leaves = await db.leaves.find({"user_id": user["_id"]}, {"_id": 1, "start_date": 1, "end_date": 1, "reason": 1, "status": 1, "created_at": 1}).sort("created_at", -1).to_list(100)
    for leave in leaves:
        leave["_id"] = str(leave["_id"])
    return leaves

@api_router.get("/leaves")
async def get_all_leaves(admin: dict = Depends(require_admin)):
    leaves = await db.leaves.find({}, {"_id": 1, "user_name": 1, "start_date": 1, "end_date": 1, "reason": 1, "status": 1, "created_at": 1}).sort("created_at", -1).to_list(1000)
    for leave in leaves:
        leave["_id"] = str(leave["_id"])
    return leaves

@api_router.post("/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, admin: dict = Depends(require_admin)):
    result = await db.leaves.update_one(
        {"_id": ObjectId(leave_id)},
        {"$set": {"status": "approved", "approved_by": admin["_id"], "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    leave = await db.leaves.find_one({"_id": ObjectId(leave_id)})
    await db.notifications.insert_one({
        "user_id": leave["user_id"],
        "message": f"Your leave request from {leave['start_date']} to {leave['end_date']} has been approved",
        "type": "leave_approved",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Leave approved successfully"}

@api_router.post("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, admin: dict = Depends(require_admin)):
    result = await db.leaves.update_one(
        {"_id": ObjectId(leave_id)},
        {"$set": {"status": "rejected", "rejected_by": admin["_id"], "rejected_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    leave = await db.leaves.find_one({"_id": ObjectId(leave_id)})
    await db.notifications.insert_one({
        "user_id": leave["user_id"],
        "message": f"Your leave request from {leave['start_date']} to {leave['end_date']} has been rejected",
        "type": "leave_rejected",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Leave rejected successfully"}

@api_router.post("/payroll/run")
async def run_payroll(admin: dict = Depends(require_admin)):
    employees = await db.users.find({"role": "employee"}, {"_id": 1, "name": 1, "email": 1, "salary": 1}).to_list(1000)
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    payroll_records = []
    
    for emp in employees:
        existing = await db.payroll.find_one({"user_id": str(emp["_id"]), "month": current_month})
        if existing:
            continue
        
        payroll_doc = {
            "user_id": str(emp["_id"]),
            "user_name": emp["name"],
            "month": current_month,
            "salary": emp.get("salary", 0),
            "status": "processed",
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.payroll.insert_one(payroll_doc)
        payroll_doc["_id"] = str(result.inserted_id)
        payroll_records.append(payroll_doc)
        
        await db.notifications.insert_one({
            "user_id": str(emp["_id"]),
            "message": f"Your salary for {current_month} has been processed",
            "type": "payroll_processed",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": f"Payroll processed for {len(payroll_records)} employees", "records": payroll_records}

@api_router.get("/payroll")
async def get_payroll(admin: dict = Depends(require_admin)):
    records = await db.payroll.find({}, {"_id": 1, "user_name": 1, "month": 1, "salary": 1, "status": 1, "processed_at": 1}).sort("processed_at", -1).to_list(1000)
    for record in records:
        record["_id"] = str(record["_id"])
    return records

@api_router.get("/salary/me")
async def get_my_salary(user: dict = Depends(get_current_user)):
    records = await db.payroll.find({"user_id": user["_id"]}, {"_id": 1, "month": 1, "salary": 1, "status": 1, "processed_at": 1}).sort("processed_at", -1).to_list(100)
    for record in records:
        record["_id"] = str(record["_id"])
    return records

@api_router.get("/notifications/me")
async def get_my_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": user["_id"]}, {"_id": 1, "message": 1, "type": 1, "read": 1, "created_at": 1}).sort("created_at", -1).to_list(100)
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    return notifications

@api_router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id), "user_id": user["_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@company.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated")
    
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write("## Default Employee Account\n")
        f.write("- Password (for all new employees): employee123\n\n")
        f.write("## Auth Endpoints\n")
        f.write("/api/auth/login\n")
        f.write("/api/auth/register\n")
        f.write("/api/auth/me\n")
        f.write("/api/auth/logout\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

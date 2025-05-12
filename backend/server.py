from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class Folder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FolderCreate(BaseModel):
    name: str
    user_id: str

class QRCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    link: str
    folder_id: Optional[str] = None
    user_id: str
    scan_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QRCodeCreate(BaseModel):
    name: str
    link: str
    folder_id: Optional[str] = None
    user_id: str

class QRCodeScan(BaseModel):
    qr_id: str


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Folder endpoints
@api_router.post("/folders", response_model=Folder)
async def create_folder(input: FolderCreate):
    folder_dict = input.dict()
    folder_obj = Folder(**folder_dict)
    await db.folders.insert_one(folder_obj.dict())
    return folder_obj

@api_router.get("/folders/{user_id}", response_model=List[Folder])
async def get_folders(user_id: str):
    folders = await db.folders.find({"user_id": user_id}).to_list(1000)
    return [Folder(**folder) for folder in folders]

# QR code endpoints
@api_router.post("/qrcodes", response_model=QRCode)
async def create_qrcode(input: QRCodeCreate):
    qrcode_dict = input.dict()
    qrcode_obj = QRCode(**qrcode_dict)
    await db.qrcodes.insert_one(qrcode_obj.dict())
    return qrcode_obj

@api_router.get("/qrcodes/{user_id}", response_model=List[QRCode])
async def get_qrcodes(user_id: str, folder_id: Optional[str] = None):
    query = {"user_id": user_id}
    if folder_id:
        query["folder_id"] = folder_id
    qrcodes = await db.qrcodes.find(query).to_list(1000)
    return [QRCode(**qrcode) for qrcode in qrcodes]

@api_router.post("/qrcodes/scan", response_model=QRCode)
async def scan_qrcode(input: QRCodeScan):
    qrcode = await db.qrcodes.find_one({"id": input.qr_id})
    if not qrcode:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    # Increment scan count
    await db.qrcodes.update_one(
        {"id": input.qr_id},
        {"$inc": {"scan_count": 1}}
    )
    
    # Return updated QR code
    updated_qrcode = await db.qrcodes.find_one({"id": input.qr_id})
    return QRCode(**updated_qrcode)

@api_router.get("/total_scans/{user_id}")
async def get_total_scans(user_id: str):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$scan_count"}}}
    ]
    result = await db.qrcodes.aggregate(pipeline).to_list(1)
    
    if not result:
        return {"total": 0}
    return {"total": result[0]["total"]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

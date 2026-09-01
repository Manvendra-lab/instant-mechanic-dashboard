from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
import json

# Initialize the API. This automatically builds documentation at /docs
app = FastAPI(title="Instant Mechanic API")

# 1. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend URLs to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Database Connection
MONGO_URL = "mongodb+srv://Manvendra:Manvendra12345678@cluster0.18twbe4.mongodb.net/?appName=Cluster0" # Paste your Atlas link here!
client = AsyncIOMotorClient(MONGO_URL)
db = client.instant_mechanic_db

# 3. WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# 4. WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keeps the connection open and waits for messages
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 5. Core REST Endpoints
@app.get("/api/bookings")
async def get_bookings(page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    
    # Get the total count of all bookings in MongoDB (should be 550)
    total = await db.bookings.count_documents({})
    
    # Fetch only the specific slice of bookings for the requested page
    cursor = db.bookings.find().sort("date", -1).skip(skip).limit(limit)
    bookings = await cursor.to_list(length=limit)
    
    # Clean up MongoDB ObjectIds
    for b in bookings:
        b["_id"] = str(b["_id"])
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "data": bookings
    }

# 6. The Status Update Mechanism
@app.put("/api/bookings/{booking_id}/status")
async def update_status(booking_id: str, new_status: str):
    # Update the status in the database
    await db.bookings.update_one(
        {"booking_id": booking_id}, 
        {"$set": {"status": new_status}}
    )
    
    # Instantly shout the update through the WebSocket tunnel
    event_payload = json.dumps({
        "event": "STATUS_UPDATE", 
        "booking_id": booking_id, 
        "status": new_status
    })
    await manager.broadcast(event_payload)
    
    return {"message": f"Booking {booking_id} updated to {new_status}"}
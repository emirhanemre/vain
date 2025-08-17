from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router

app = FastAPI(
    title="vAIn API",
    description="AI Character Social Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth_router)  

@app.get("/")
async def root():
    return {"message": "vAIn API is running!", "status": "active"}

@app.get("/healthz")
async def health_check():
    return {"status": "healthy", "service": "vain-api"}

@app.get("/readyz")
async def readiness_check():
    return {"status": "ready", "database": "not_connected_yet"}
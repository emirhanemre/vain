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
allow_origins=[
        # Development origins
        "http://localhost:3000",           # FastAPI server
        "http://127.0.0.1:3000",            # Alternative localhost
        "http://localhost:8081",           # Expo development server
        "http://localhost:19006",          # Expo web server (alternative)
        
        # Future production origins (update when deployed)
        # "https://your-app-name.vercel.app",
        # "https://your-backend.herokuapp.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",      # For JWT tokens
        "Content-Type",       # For JSON requests
        "Accept",            # Standard header
        "Origin",            # CORS header
        "X-Requested-With",  # AJAX requests
    ],
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
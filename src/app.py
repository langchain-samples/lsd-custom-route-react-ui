import pathlib
import sys

from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Ensure sibling modules are importable
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from auth import create_user, login_user

app = FastAPI()

# Resolve to absolute path so it works regardless of CWD
FRONTEND_BUILD_DIR = (
    pathlib.Path(__file__).resolve().parent.parent / "frontend" / "dist"
)


class AuthRequest(BaseModel):
    email: str
    password: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/signup")
def signup(body: AuthRequest):
    try:
        return create_user(body.email, body.password)
    except ValueError as e:
        from fastapi.responses import JSONResponse

        return JSONResponse({"error": str(e)}, status_code=400)


@app.post("/auth/login")
def login(body: AuthRequest):
    try:
        return login_user(body.email, body.password)
    except ValueError as e:
        from fastapi.responses import JSONResponse

        return JSONResponse({"error": str(e)}, status_code=401)


@app.get("/app")
def app_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/app/")


if FRONTEND_BUILD_DIR.is_dir() and (FRONTEND_BUILD_DIR / "index.html").is_file():
    app.mount(
        "/app",
        StaticFiles(directory=str(FRONTEND_BUILD_DIR), html=True),
        name="frontend",
    )
else:

    @app.get("/app/{path:path}")
    def frontend_not_built(path: str = ""):
        return PlainTextResponse(
            f"Frontend not built at {FRONTEND_BUILD_DIR}. "
            "Run 'cd frontend && npm install && npm run build'.",
            status_code=503,
        )

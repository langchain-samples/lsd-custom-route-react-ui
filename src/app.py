import pathlib

from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Resolve to absolute path so it works regardless of CWD
FRONTEND_BUILD_DIR = (
    pathlib.Path(__file__).resolve().parent.parent / "frontend" / "dist"
)


@app.get("/health")
def health():
    return {"status": "ok"}


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

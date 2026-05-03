from fastapi import APIRouter

from app.api.v1.endpoints import albums, artists, auth, library, ratings

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(artists.router, prefix="/artists", tags=["artists"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(ratings.router, tags=["ratings"])
api_router.include_router(library.router, prefix="/me", tags=["library"])

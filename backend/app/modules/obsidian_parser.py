from __future__ import annotations

from pathlib import Path

from app.modules.document_ingestion import SUPPORTED_VAULT_EXTENSIONS, read_document


CAREER_KEYWORDS = {
    "experience",
    "project",
    "skill",
    "resume",
    "cv",
    "certification",
    "publication",
    "career",
    "job",
    "interview",
    "achievement",
}


def scan_vault(vault_path: str) -> list[dict[str, str]]:
    root = Path(vault_path).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Vault folder not found: {root}")

    documents: list[dict[str, str]] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_VAULT_EXTENSIONS:
            continue
        content = read_document(path)
        lower_blob = f"{path.name}\n{content[:4000]}".lower()
        if any(keyword in lower_blob for keyword in CAREER_KEYWORDS):
            documents.append(
                {
                    "name": path.name,
                    "path": str(path),
                    "content": content,
                    "source_type": "obsidian",
                }
            )
    return documents


from __future__ import annotations

from pathlib import Path


SUPPORTED_FILE_EXTENSIONS = {".md", ".txt", ".pdf", ".docx"}
SUPPORTED_VAULT_EXTENSIONS = {".md", ".txt"}


def read_document(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".md", ".txt"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # pragma: no cover - depends on optional parser quality
            return f"[Unable to parse PDF {path.name}: {exc}]"
    if suffix == ".docx":
        try:
            from docx import Document

            doc = Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as exc:  # pragma: no cover
            return f"[Unable to parse DOCX {path.name}: {exc}]"
    raise ValueError(f"Unsupported file type: {suffix}")


def normalize_uploaded_name(filename: str) -> str:
    return Path(filename).name.replace("\x00", "")


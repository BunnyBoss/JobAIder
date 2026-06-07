# JobAIder - Complete Repository Architecture

## Repository Structure Overview

```mermaid
graph TD
    %% Main Directories
    A[JobAIder Repository] --> B[backend]
    A --> C[frontend]
    A --> D[docs]
    A --> E[Jobs]
    A --> F[logs]
    A --> G[Root Files]
    
    %% Backend Structure
    subgraph Backend[backend/]
        B1[app/] --> B
        B2[__pycache__/] --> B
    end
    
    subgraph BackendApp[app/]
        BA1[main.py] --> B1
        BA2[schemas.py] --> B1
        BA3[db.py] --> B1
        BA4[__init__.py] --> B1
        
        BA5[core/] --> B1
        BA6[modules/] --> B1
    end
    
    subgraph Core[core/]
        C1[config.py] --> BA5
        C2[__init__.py] --> BA5
    end
    
    subgraph Modules[modules/]
        M1[profile_builder.py] --> BA6
        M2[role_analyzer.py] --> BA6
        M3[resume_generator.py] --> BA6
        M4[gap_analyzer.py] --> BA6
        M5[interview_coach.py] --> BA6
        M6[improvement_planner.py] --> BA6
        M7[document_ingestion.py] --> BA6
        M8[obsidian_parser.py] --> BA6
        M9[llm_provider.py] --> BA6
        M10[__init__.py] --> BA6
    end
    
    %% Frontend Structure
    subgraph Frontend[frontend/]
        F1[app/] --> C
        F2[components/] --> C
        F3[lib/] --> C
        F4[public/] --> C
        F5[node_modules/] --> C
        F6[.next/] --> C
        F7[Config Files] --> C
    end
    
    subgraph FrontendApp[app/]
        FA1[dashboard/] --> F1
        FA2[gap-analysis/] --> F1
        FA3[improvement-plan/] --> F1
        FA4[interview-prep/] --> F1
        FA5[resume-editor/] --> F1
        FA6[resume-studio/] --> F1
        FA7[role-analysis/] --> F1
        FA8[settings/] --> F1
        FA9[user-profile/] --> F1
        FA10[layout.tsx] --> F1
        FA11[page.tsx] --> F1
        FA12[globals.css] --> F1
    end
    
    subgraph FrontendComponents[components/]
        FC1[app-shell.tsx] --> F2
        FC2[page-header.tsx] --> F2
        FC3[resume-context-panel.tsx] --> F2
        FC4[status-panel.tsx] --> F2
        FC5[saved-selectors.tsx] --> F2
        FC6[providers.tsx] --> F2
        FC7[ui/] --> F2
    end
    
    subgraph FrontendLib[lib/]
        FL1[api.ts] --> F3
        FL2[utils.ts] --> F3
    end
    
    subgraph FrontendUI[ui/]
        FU1[button.tsx] --> FC7
        FU2[card.tsx] --> FC7
        FU3[input.tsx] --> FC7
        FU4[select.tsx] --> FC7
        FU5[textarea.tsx] --> FC7
    end
    
    %% Other Directories
    subgraph Documentation[docs/]
        D1[*.md files] --> D
    end
    
    subgraph Jobs[Jobs/]
        J1[Job files] --> E
    end
    
    subgraph Logs[logs/]
        L1[Log files] --> F
    end
    
    %% Root Files
    subgraph RootFiles[Root Files]
        RF1[README.md] --> G
        RF2[ats-resume.md] --> G
        RF3[human-friendly-resume.md] --> G
        RF4[tailored-resume.md] --> G
        RF5[jobradar.db] --> G
        RF6[.gitignore] --> G
        RF7[CLAUDE.md] --> G
    end

    %% Key Relationships
    BA1 -->|imports| BA2
    BA1 -->|imports| BA3
    BA1 -->|imports| BA6
    
    BA6 -->|contains| M1
    BA6 -->|contains| M2
    BA6 -->|contains| M3
    BA6 -->|contains| M4
    BA6 -->|contains| M5
    BA6 -->|contains| M6
    BA6 -->|contains| M7
    BA6 -->|contains| M8
    BA6 -->|contains| M9
    
    F1 -->|uses| F2
    F1 -->|uses| F3
    F3 -->|calls| BA1

    %% Styling
    classDef directory fill:#bbf,stroke:#333,stroke-width:2px;
    classDef file fill:#9f9,stroke:#333,stroke-width:1px;
    classDef module fill:#f9f,stroke:#333,stroke-width:1px;
    
    class A,G directory
    class B,C,D,E,F directory
    class B1,B2,BA1,BA2,BA3,BA4,BA5,BA6 directory
    class BA1,BA2,BA3,BA4 file
    class C1,C2,M1,M2,M3,M4,M5,M6,M7,M8,M9,M10 file
    class F1,F2,F3,F4,F5,F6,F7 directory
    class FA1,FA2,FA3,FA4,FA5,FA6,FA7,FA8,FA9,FA10,FA11,FA12 file
    class FC1,FC2,FC3,FC4,FC5,FC6,FC7 directory
    class FL1,FL2 file
    class FC7 directory
    class FU1,FU2,FU3,FU4,FU5 file
    class D1,J1,L1,RF1,RF2,RF3,RF4,RF5,RF6,RF7 file
```

## Detailed Component Breakdown


### Data Flow Diagram

```mermaid
flowchart LR
    %% Actors
    User[User] -->|Interacts with| Frontend
    
    %% Frontend Components
    subgraph Frontend[Next.js Frontend]
        UI[UI Components] -->|Calls| API
        API[API Client] -->|HTTP Requests| Backend
    end
    
    %% Backend Components
    subgraph Backend[FastAPI Backend]
        Routes[API Routes] -->|Processes| Controllers
        Controllers[Controllers] -->|Uses| Services
        Services[Services] -->|Queries| Database
        Services -->|Calls| LLM
    end
    
    %% External Services
    LLM[LLM Provider] -->|Returns| Services
    Database[SQLite DB] -->|Returns| Services
    
    %% Data Flow Details
    User -->|1. Uploads documents| Frontend
    Frontend -->|2. Sends to backend| Backend
    Backend -->|3. Stores in DB| Database
    
    User -->|4. Builds profile| Frontend
    Frontend -->|5. Requests analysis| Backend
    Backend -->|6. Uses LLM| LLM
    LLM -->|7. Returns analysis| Backend
    Backend -->|8. Stores profile| Database
    
    User -->|9. Analyzes role| Frontend
    Frontend -->|10. Sends job desc| Backend
    Backend -->|11. Uses LLM| LLM
    LLM -->|12. Returns analysis| Backend
    Backend -->|13. Stores analysis| Database
    
    User -->|14. Generates resume| Frontend
    Frontend -->|15. Requests resume| Backend
    Backend -->|16. Retrieves data| Database
    Backend -->|17. Uses LLM| LLM
    LLM -->|18. Returns resume| Backend
    Backend -->|19. Stores resume| Database
    
    %% Styling
    classDef actor fill:#fff,stroke:#333;
    classDef frontend fill:#f96,color:white;
    classDef backend fill:#69f,color:white;
    classDef external fill:#9f6,color:white;
    classDef database fill:#6cf,color:white;
    
    class User actor
    class Frontend frontend
    class Backend backend
    class LLM,Database external
```

## Key Features and Workflows

### 1. Profile Building Workflow
```mermaid
flowchart TD
    A[User Uploads Documents] --> B[Document Ingestion]
    B --> C[Text Extraction]
    C --> D[Profile Builder]
    D --> E[LLM Analysis]
    E --> F[Profile Created]
    F --> G[Store in Database]
```

### 2. Role Analysis Workflow
```mermaid
flowchart TD
    A[User Provides Job Description] --> B[Role Analyzer]
    B --> C[Metadata Extraction]
    C --> D[LLM Analysis]
    D --> E[Requirements Parsing]
    E --> F[Role Analysis Created]
    F --> G[Store in Database]
```

### 3. Resume Generation Workflow
```mermaid
flowchart TD
    A[User Requests Resume] --> B[Select Profile & Role]
    B --> C[Resume Generator]
    C --> D[Retrieve Profile Data]
    D --> E[Retrieve Role Data]
    E --> F[LLM Formatting]
    F --> G[Generate ATS/Human Versions]
    G --> H[Store in Database]
```

### 4. Gap Analysis Workflow
```mermaid
flowchart TD
    A[User Requests Gap Analysis] --> B[Select Profile & Role]
    B --> C[Gap Analyzer]
    C --> D[Retrieve Profile]
    D --> E[Retrieve Role Analysis]
    E --> F[LLM Comparison]
    F --> G[Calculate Match Scores]
    G --> H[Identify Missing Skills]
    H --> I[Store in Database]
```

### 5. Interview Preparation Workflow
```mermaid
flowchart TD
    A[User Starts Interview] --> B[Select Mode & Difficulty]
    B --> C[Interview Coach]
    C --> D[Generate First Question]
    D --> E[User Answers]
    E --> F[LLM Evaluation]
    F --> G[Generate Feedback]
    G --> H[Generate Next Question]
    H --> I[Repeat or Complete]
```



## Database Schema

```mermaid
erDiagram
    settings ||--o{ documents : "stores"
    documents ||--o{ profiles : "source"
    profiles ||--o{ resumes : "creates"
    profiles ||--o{ gap_analyses : "analyzes"
    profiles ||--o{ interview_sessions : "uses"
    
    role_analyses ||--o{ resumes : "targets"
    role_analyses ||--o{ gap_analyses : "analyzes"
    role_analyses ||--o{ interview_sessions : "uses"
    
    gap_analyses ||--o{ improvement_plans : "generates"
    
    profiles {
        int id
        string name
        string summary
        json profile_json
        datetime created_at
        datetime updated_at
    }
    
    role_analyses {
        int id
        string title
        string company
        text source_text
        json analysis_json
        datetime created_at
    }
    
    resumes {
        int id
        int profile_id
        int role_analysis_id
        string kind
        string title
        text markdown
        json metadata_json
        datetime created_at
    }
    
    gap_analyses {
        int id
        int profile_id
        int role_analysis_id
        json analysis_json
        datetime created_at
    }
    
    interview_sessions {
        int id
        int profile_id
        int role_analysis_id
        string mode
        string difficulty
        int question_count
        json history_json
        datetime created_at
        datetime updated_at
    }
    
    improvement_plans {
        int id
        int gap_analysis_id
        int profile_id
        int role_analysis_id
        json plan_json
        datetime created_at
    }
    
    documents {
        int id
        string source_type
        string name
        string path
        text content
        json metadata_json
        datetime created_at
    }
    
    settings {
        string key
        string value
        datetime updated_at
    }
```

## Technology Stack

```mermaid
pie
    title JobAIder Technology Stack
    "Backend - FastAPI" : 30
    "Frontend - Next.js" : 25
    "Database - SQLite" : 15
    "LLM - OpenAI/GPT" : 20
    "Other - Tailwind, TypeScript" : 10
```

## Summary

This comprehensive architecture documentation covers:

1. **Repository Structure**: Complete file and directory hierarchy
2. **Backend Architecture**: Class diagram of all modules and their relationships
3. **Frontend Architecture**: Component structure and page relationships
4. **Data Flow**: How data moves through the system
5. **Workflows**: Detailed process flows for each major feature
6. **Database Schema**: Entity-relationship diagram of all tables
7. **Technology Stack**: Visual breakdown of technologies used

The Mermaid diagrams provide interactive visualizations that can be viewed in any Mermaid-compatible viewer.

# Software Requirements Specification (SRS)
## AI Contract Clause Risk Analyzer & Negotiation Assistant (UC23)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this system is to enable **Small and Medium Enterprises (SMEs)** to understand complex legal contracts without requiring legal expertise. The system leverages **Artificial Intelligence (AI)** to identify risky clauses, provide simplified explanations, and generate actionable negotiation suggestions.

### 1.2 Scope
The system consists of:
- A **Backend Application Programming Interface (API)**
- An **Angular-based User Interface**
- An **Administrative Dashboard**

Core capabilities include:
- Automated clause extraction
- Risk classification and scoring
- Contract comparison and redlining
- AI-generated negotiation suggestions
- Audit logging and monitoring

The system is designed for **end-to-end usability within a single session**, minimizing user training requirements.

### 1.3 Technology Stack
- **Frontend:** Angular
- **Backend:** Node.js (Express) *(aligned with implementation)*
- **Database:** PostgreSQL
- **AI Engine:** OpenAI GPT-4o
- **Authentication:** JSON Web Token (JWT)
- **Deployment:** Docker (optional)

---

## 2. Users and Roles

### 2.1 Legal Professional / Paralegal
- Reviews contract clauses and risk insights
- Validates AI-generated suggestions
- Uses recommendations during negotiations

### 2.2 Compliance Officer
- Monitors overall contract risk exposure
- Reviews flagged or low-confidence outputs
- Initiates escalation or review workflows

### 2.3 System Administrator
- Configures thresholds and rate limits
- Manages audit logs and system settings
- Monitors performance and system health

### 2.4 System (Automated Actor)
- Executes AI-driven analysis
- Performs clause extraction and classification
- Generates insights and recommendations without manual intervention

---

## 3. Functional Requirements

### 3.1 Input & Processing
The system shall:
- Accept authenticated API requests using **JWT authentication**
- Validate contract text input for completeness and correctness
- Generate a **unique reference ID** for each request
- Ensure request processing is stateless and scalable

---

### 3.2 AI Capabilities
The system shall:
- Extract clauses using **Natural Language Processing (NLP)**
- Classify risk levels into:
  - Low
  - Medium
  - High
  - Critical
- Detect **one-sided, biased, or unfair contract terms**
- Perform **Named Entity Recognition (NER)** including:
  - Parties
  - Dates
  - Monetary values
  - Jurisdictions
  - Obligations
- Compare contract versions and highlight differences

---

### 3.3 Output & Insights
The system shall:
- Provide **plain-language explanations** in English and Hindi
- Suggest improved or balanced clause alternatives
- Generate structured contract comparison outputs
- Provide a **confidence score (0–1)** for every AI-generated result
- Clearly indicate risk reasoning for each clause

---

### 3.4 Fallback Handling
If the confidence score is below the configurable threshold (default: 0.6):

The system shall:
- Mark the result as **"Requires Human Review"**
- Provide a fallback message:
  > “Unable to determine with sufficient confidence”
- Prevent delivery of unverified or misleading insights

---

### 3.5 Logging & Monitoring
The system shall:
- Record all AI interactions in **audit logs**
- Store the following metadata:
  - Input contract text
  - Generated output
  - Timestamp
  - Model version (e.g., GPT-4o)
  - Prompt version
  - Confidence score
- Ensure logs are queryable and exportable

---

### 3.6 Admin Features
The system shall provide an administrative dashboard with:

#### Monitoring:
- Total request volume
- Confidence score distribution
- Low-confidence case count
- Error rates

#### Configuration:
- Adjustable confidence threshold
- Rate limiting controls
- Export audit logs in CSV format

---

## 4. Non-Functional Requirements

### 4.1 Performance
- API response time: **< 5 seconds** (excluding external AI latency)
- Clause extraction execution time: **< 3 seconds**

---

### 4.2 Reliability
- System shall operate continuously during a **15-minute demo run**
- No crashes, memory leaks, or service interruptions

---

### 4.3 Security
- Secure handling of sensitive contract data
- Token-based authentication (JWT)
- Input validation and sanitization
- Protection against unauthorized API access

---

### 4.4 Deployability
- System shall support containerized deployment via Docker
- Easy setup for local and cloud environments

---

### 4.5 Hardware Requirements
- Compatible with standard laptop configurations
- No GPU acceleration required

---

## 5. API Endpoints

### 5.1 Contract APIs
- `POST /contracts/analyze` → Perform contract risk analysis  
- `POST /contracts/extract-clauses` → Extract clauses (measurable output)  
- `GET /contracts/{id}/result` → Retrieve analysis results  
- `POST /contracts/compare` → Compare contract versions  

### 5.2 Admin APIs
- `GET /admin/dashboard` → Retrieve system metrics  
- `PUT /admin/settings` → Update configuration settings  
- `GET /admin/audit-logs/export` → Export audit logs  

---

## 6. Data Requirements

### 6.1 Input Data
- Contract text
- Optional second contract (for comparison)

### 6.2 Output Data
- Clause-level analysis
- Risk classification
- Plain-language explanation
- Suggested alternatives
- Confidence scores

### 6.3 Storage
PostgreSQL database stores:
- Contracts
- Analysis results
- Audit logs
- Configuration settings

---

## 7. Acceptance Criteria

The system is considered complete when:

1. Users can complete the entire workflow in a **single session**
2. Clause extraction completes within **3 seconds**
3. Every AI output includes a **confidence score**
4. Low-confidence results trigger a **fallback mechanism**
5. All AI operations are **logged with complete metadata**
6. The system runs without failure during demo execution
7. All abbreviations are expanded on first use:
   - Artificial Intelligence (AI)
   - Application Programming Interface (API)
   - Natural Language Processing (NLP)

---

## 8. Assumptions & Constraints

- Internet connectivity is required for AI processing
- AI response latency depends on external API availability
- Output accuracy depends on input contract quality

---

## 9. Future Enhancements

- Multi-language expansion beyond Hindi and English
- Integration with legal databases and case law systems
- Advanced machine learning-based risk scoring
- Real-time collaboration and contract editing features
# Software Requirements Specification (SRS)
## AI Contract Clause Risk Analyzer & Negotiation Assistant (UC23)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this system is to assist **Small and Medium Enterprises (SMEs)** in understanding complex legal contracts by automatically identifying risky clauses, explaining them in simple language, and providing negotiation recommendations using **Artificial Intelligence (AI)**.

### 1.2 Scope
The system provides a **Backend Application Programming Interface (API)** and an **Admin Dashboard** that performs:

- Contract clause extraction
- Risk classification
- Contract comparison
- AI-based negotiation suggestions
- Audit logging and monitoring

The system is designed to operate in a **single-session workflow**, ensuring ease of use without requiring prior legal expertise.

### 1.3 Technology Stack
- **Backend:** Node.js (Express) *(or Python FastAPI if applicable)*
- **Frontend:** Angular
- **Database:** PostgreSQL
- **AI Engine:** OpenAI GPT-4o
- **Deployment:** Docker (optional for production)

---

## 2. Users and Roles

### 2.1 Legal Professional / Paralegal
- Reviews contracts and clauses
- Interprets AI-generated risk insights
- Uses suggestions for negotiation

### 2.2 Compliance Officer
- Monitors contract risk levels
- Reviews flagged or low-confidence results
- Takes escalation decisions

### 2.3 System Administrator
- Configures system settings (thresholds, rate limits)
- Monitors system performance and logs
- Exports audit reports

### 2.4 System (Automated)
- Executes AI-based analysis
- Extracts clauses and entities
- Generates risk insights and suggestions

---

## 3. Functional Requirements

### 3.1 Input & Processing
- The system shall accept **authenticated API requests**
- The system shall validate input contract text
- The system shall return a **unique reference ID** for each request

### 3.2 AI Capabilities
The system shall:
- Extract clauses using **Natural Language Processing (NLP)**
- Classify risk levels (Low, Medium, High, Critical)
- Detect one-sided or unfair contractual terms
- Perform **Named Entity Recognition (NER)**:
  - Parties
  - Dates
  - Monetary values
  - Obligations
- Compare different versions of contracts

### 3.3 Output & Insights
The system shall:
- Provide **plain-language explanations** (Hindi or English)
- Suggest improved or balanced clause alternatives
- Generate contract comparison insights
- Return a **confidence score (0–1)** for each AI decision

### 3.4 Fallback Handling
If confidence score < configurable threshold (default: 0.6):
- Mark result as **Requires Human Review**
- Provide fallback message:
  - “Unable to determine with high confidence”
- Prevent unverified decision output

### 3.5 Logging & Monitoring
The system shall:
- Record all AI operations in **audit logs**
- Store:
  - Input text
  - Output result
  - Timestamp
  - Model version
  - Confidence score

### 3.6 Admin Features
The system shall provide an admin dashboard with:
- Total request volume
- Confidence score distribution
- Error rate monitoring

Admin controls:
- Update confidence thresholds
- Set rate limits
- Export audit logs (CSV format)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- API response time: **< 5 seconds**
- Clause extraction: **< 3 seconds**

### 4.2 Reliability
- System shall run continuously during demo without crashes
- No memory leaks during a 15-minute test run

### 4.3 Security
- Secure handling of contract data
- Token-based authentication (JWT)
- Input validation and sanitization

### 4.4 Deployability
- System shall be deployable using Docker
- Easy setup on local development environment

### 4.5 Hardware Requirements
- Runs on standard laptop configuration
- No GPU required

---

## 5. API Endpoints

### 5.1 Contract APIs
- `POST /contracts/analyze` → Analyze contract
- `POST /contracts/extract-clauses` → Extract clauses (testable output)
- `GET /contracts/{id}/result` → Retrieve analysis result
- `POST /contracts/compare` → Compare contracts

### 5.2 Admin APIs
- `GET /admin/dashboard` → System metrics
- `PUT /admin/settings` → Update configuration
- `GET /admin/audit-logs/export` → Download audit logs

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
- System settings

---

## 7. Acceptance Criteria

1. Users can complete the full workflow in a **single session**
2. Clause extraction completes within **3 seconds**
3. Every AI output includes a **confidence score**
4. Low-confidence results trigger **fallback mechanism**
5. All AI operations are **logged with metadata**
6. System runs without crashes during demo execution
7. All user-facing terms expand abbreviations:
   - Artificial Intelligence (AI)
   - Application Programming Interface (API)
   - Natural Language Processing (NLP)

---

## 8. Assumptions & Constraints

- Internet connectivity is required for AI processing
- OpenAI API availability affects response time
- System accuracy depends on input contract quality

---

## 9. Future Enhancements

- Multi-language support expansion
- Integration with legal databases
- Advanced risk scoring models
- Real-time collaboration features
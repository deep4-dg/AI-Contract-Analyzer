# Software Requirements Specification (SRS)
## AI Contract Clause Risk Analyzer & Negotiation Assistant (UC23)

---

## 1. Introduction

### 1.1 Purpose
This system is designed to help Small and Medium Enterprises (SMEs) understand legal contracts, identify risky clauses, and receive negotiation suggestions in simple language.

### 1.2 Scope
The solution consists of a Backend Application Programming Interface (API) and an Admin Panel that analyzes contracts using Artificial Intelligence. It performs clause extraction, risk analysis, comparison, and suggestion generation.

### 1.3 Technology Stack
- **Backend:** Python (FastAPI)
- **Database:** PostgreSQL
- **AI Engine:** OpenAI GPT-4o
- **Deployment:** Docker

---

## 2. Users and Roles

### 2.1 Legal Professional / Paralegal
- Reviews contracts  
- Analyzes clauses and risks  
- Uses suggestions for negotiation  

### 2.2 Compliance Officer
- Monitors contract risks  
- Reviews flagged or low-confidence cases  

### 2.3 Administrator
- Configures system settings  
- Manages thresholds and logs  
- Monitors system performance  

### 2.4 System (Automated)
- Performs AI-based processing  
- Extracts clauses and generates insights  

---

## 3. Functional Requirements

### 3.1 Input & Processing
- Accept authenticated API requests  
- Analyze contracts and return a reference ID  
- Validate input data and reject invalid inputs  

### 3.2 AI Capabilities
- Extract clauses using Natural Language Processing (NLP)  
- Classify risk level for each clause  
- Detect one-sided or unfair terms  
- Perform legal entity recognition (parties, dates, obligations, etc.)  
- Compare clauses or contract versions  

### 3.3 Output & Insights
- Provide plain-language explanations in Hindi or English  
- Suggest improved or balanced clause alternatives  
- Generate redline comparisons between contract versions  
- Provide a confidence score (0 to 1)  

### 3.4 Fallback Handling
If confidence score < 0.6:
- Trigger human review OR  
- Return fallback response  

### 3.5 Logging & Monitoring
- Maintain audit logs for all AI decisions  
- Log input, output, timestamp, model version, and confidence score  

### 3.6 Admin Features
Dashboard includes:
- Request volume  
- Confidence distribution  
- Error rates  

Admin controls:
- Confidence thresholds  
- Rate limits  
- Export logs in CSV format  

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Response time < 5 seconds  
- Clause extraction < 3 seconds  

### 4.2 Reliability
- System runs continuously without crashes  

### 4.3 Security
- Secure handling of contract data  
- Authentication and validation  

### 4.4 Deployability
- Docker-based deployment  

### 4.5 Hardware
- Runs on standard laptop  
- No GPU required  

---

## 5. API Endpoints

### 5.1 Contract APIs
- `POST /contracts/analyze` → Analyze contract  
- `GET /contracts/{id}/status` → Check status  
- `GET /contracts/{id}/result` → Get result  
- `POST /contracts/compare` → Compare contracts  

### 5.2 Admin APIs
- `GET /admin/dashboard` → Metrics  
- `PUT /admin/settings` → Update settings  

---

## 6. Data Requirements

### 6.1 Input Data
- Contract text  
- Optional second contract  

### 6.2 Output Data
- Clause analysis  
- Risk classification  
- Explanation  
- Suggestions  
- Confidence scores  

### 6.3 Storage
PostgreSQL stores:
- Contracts  
- Results  
- Logs  
- Settings  

---

## 7. Acceptance Criteria
- End-to-end workflow in one session  
- Clause extraction < 3 seconds  
- All outputs include confidence score  
- Low-confidence triggers fallback  
- All AI operations logged  
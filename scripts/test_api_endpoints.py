"""
CareerOS API Testing Script
Tests all endpoints with realistic sample data
"""

import requests
import json
import time
from typing import Dict, Any
from datetime import datetime

# Configuration
API_BASE_URL = "http://127.0.0.1:8000"
USER_ID = "00000000-0000-0000-0000-000000000001"

# Colors for console output
class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ {text}{Colors.ENDC}")

def print_request(method: str, endpoint: str, data: dict = None):
    print(f"\n{Colors.YELLOW}→ {method} {endpoint}{Colors.ENDC}")
    if data:
        print(f"  Payload: {json.dumps(data, indent=2)[:200]}...")

def print_response(status: int, data: Any):
    status_color = Colors.GREEN if 200 <= status < 300 else Colors.RED
    print(f"  {status_color}Status: {status}{Colors.ENDC}")
    if isinstance(data, dict):
        print(f"  Response: {json.dumps(data, indent=2)[:300]}...")

def test_endpoint(method: str, endpoint: str, data: dict = None, headers: dict = None) -> tuple[int, Any]:
    """Make API request and return (status_code, response_data)"""
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=data, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print_request(method, endpoint, data)
        print_response(response.status_code, response.json() if response.text else {})
        
        return response.status_code, response.json() if response.text else {}
    except requests.exceptions.ConnectionError:
        print_request(method, endpoint, data)
        print_error("Connection failed - is backend running on http://127.0.0.1:8000?")
        return 0, {}
    except Exception as e:
        print_request(method, endpoint, data)
        print_error(f"Request failed: {str(e)}")
        return 0, {}

# ============================================================================
# SAMPLE DATA
# ============================================================================

SAMPLE_ACHIEVEMENTS = [
    {
        "title": "Payment System Architecture",
        "text": "Architected and deployed a real-time payment processing system handling $50M in annual transactions across 500K daily active users using event-driven architecture."
    },
    {
        "title": "CI/CD Pipeline Optimization",
        "text": "Improved CI pipeline reliability by reducing flaky tests 42% using pytest markers and stable fixtures, cutting deployment time from 20m to 3m."
    },
    {
        "title": "React Performance",
        "text": "Optimized React app performance, reducing bundle size by 35% and initial load time from 8s to 2.5s using code splitting and lazy loading."
    },
    {
        "title": "Team Leadership",
        "text": "Led team of 5 engineers building microservices platform, mentored 2 junior devs, delivered 1.2M LOC, improved code coverage from 60% to 92%."
    },
    {
        "title": "Database Optimization",
        "text": "Redesigned PostgreSQL schema for analytics queries, added strategic indexes and partitioning, reduced query time by 85% for billion-row datasets."
    },
]

SAMPLE_JOB_DESCRIPTIONS = [
    {
        "title": "Senior React Developer",
        "text": """Senior React Developer - Remote, $200-250K
        
Required Skills:
- 5+ years React/TypeScript development
- Next.js, Redux/Zustand state management
- REST APIs, GraphQL consumption
- Testing frameworks (Jest, React Testing Library)
- AWS or cloud platform experience
- Agile/Scrum methodology

Nice to Have:
- Performance optimization experience
- Web3/Blockchain knowledge
- Machine Learning integration
- Mobile development (React Native)

Responsibilities:
- Build scalable React applications
- Mentor junior developers
- Code review and architecture discussions
- Performance optimization
- CI/CD pipeline maintenance
"""
    },
    {
        "title": "Backend Engineer (Python/FastAPI)",
        "text": """Backend Engineer - Python/FastAPI - NYC, Hybrid
        
Required:
- 3+ years Python backend development
- FastAPI, Django, or similar frameworks
- SQL/PostgreSQL database design
- REST API design and development
- Docker and Kubernetes basics
- Git and agile development

Nice to Have:
- Microservices architecture
- Event-driven systems
- Message queues (RabbitMQ, Kafka)
- AWS/GCP experience
- System design skills

You'll work on:
- Scalable API development
- Database optimization
- System architecture
- Team mentorship
- DevOps collaboration
"""
    },
]

# ============================================================================
# TEST SUITES
# ============================================================================

def test_health_check():
    """Test basic health endpoint"""
    print_header("TEST 1: Health Check")
    print_info("Testing basic backend connectivity")
    
    status, data = test_endpoint("GET", "/health")
    
    if status == 200:
        print_success("Backend is running")
        return True
    else:
        print_error("Backend health check failed")
        return False

def test_events_creation():
    """Test Career Events creation"""
    print_header("TEST 2: Career Events - Create Events")
    print_info("Creating structured career events from raw achievements")
    
    event_ids = []
    for i, achievement in enumerate(SAMPLE_ACHIEVEMENTS[:3], 1):
        print(f"\nCreating event {i}/3: {achievement['title']}")
        
        payload = {
            "user_id": USER_ID,
            "raw_text": achievement["text"]
        }
        
        status, data = test_endpoint("POST", "/events", payload)
        
        if status == 200:
            event_id = data.get("id")
            if event_id:
                event_ids.append(event_id)
                print_success(f"Event created: {event_id}")
                print_info(f"  Domain: {data.get('domain')}")
                print_info(f"  Action: {data.get('action')}")
                print_info(f"  Impact: {data.get('impact_value')} {data.get('impact_metric')}")
                print_info(f"  Confidence: {data.get('confidence', 0):.2%}")
            time.sleep(1)  # Rate limiting
        else:
            print_error(f"Failed to create event {i}")
    
    return event_ids

def test_resume_generation(event_ids: list):
    """Test Resume Generation endpoint"""
    print_header("TEST 3: Resume Generation")
    print_info("Generating resume targeting a specific job description")
    
    if not event_ids:
        print_error("No events to generate from - skipping resume generation")
        return None
    
    payload = {
        "user_id": USER_ID,
        "job_description": SAMPLE_JOB_DESCRIPTIONS[0]["text"],
        "k": 3
    }
    
    status, data = test_endpoint("POST", "/resume/generate", payload)
    
    if status == 200:
        print_success("Resume generated successfully")
        print_info(f"  Bullets generated: {len(data.get('bullets', []))}")
        print_info(f"  Overall score: {data.get('evaluation', {}).get('overall_score', 'N/A')}")
        
        bullets = data.get('bullets', [])
        for i, bullet in enumerate(bullets[:3], 1):
            print_info(f"  Bullet {i}: {bullet[:80]}...")
        
        return data
    else:
        print_error("Resume generation failed")
        return None

def test_resume_chat():
    """Test Resume Chat endpoint (NEW)"""
    print_header("TEST 4: Resume Chat (NEW - Chatbot)")
    print_info("Testing AI-assisted resume bullet generation")
    
    test_inputs = [
        "I built a React dashboard that increased user engagement by 40%",
        "Led migration of legacy monolith to microservices, reduced deployment time 60%",
        "Implemented Redis caching strategy, improved API response time from 2s to 200ms"
    ]
    
    for i, user_input in enumerate(test_inputs[:2], 1):
        print(f"\nChat input {i}: {user_input}")
        
        payload = {
            "user_id": USER_ID,
            "user_input": user_input,
            "resume_id": f"resume-{i}",
            "context": None
        }
        
        status, data = test_endpoint("POST", "/resume/chat", payload)
        
        if status == 200:
            print_success("Chat response received")
            print_info(f"  AI Response: {data.get('response', '')[:100]}...")
            
            if data.get('generated_bullet'):
                bullet = data['generated_bullet']
                print_info(f"  Generated bullet section: {bullet.get('section')}")
                print_info(f"  Bullet text: {bullet.get('content')}")
            
            if data.get('follow_up_questions'):
                print_info(f"  Follow-up questions:")
                for q in data['follow_up_questions'][:2]:
                    print_info(f"    • {q}")
            
            print_info(f"  Confidence: {data.get('confidence', 0):.2%}")
            time.sleep(1)
        else:
            print_error("Chat request failed")

def test_jd_eligibility():
    """Test JD Eligibility Analysis (NEW)"""
    print_header("TEST 5: JD Eligibility Analysis (NEW)")
    print_info("Testing job description fit analysis")
    
    jd = SAMPLE_JOB_DESCRIPTIONS[0]["text"]
    print(f"Job: {SAMPLE_JOB_DESCRIPTIONS[0]['title']}")
    
    payload = {
        "user_id": USER_ID,
        "job_description": jd
    }
    
    status, data = test_endpoint("POST", "/resume/jd-eligibility", payload)
    
    if status == 200:
        print_success("Eligibility analysis completed")
        print_info(f"  Eligibility Score: {data.get('eligibility_score', 0):.0f}%")
        print_info(f"  Summary: {data.get('summary', 'N/A')}")
        
        matched = data.get('matched_skills', [])
        print_info(f"  Matched skills ({len(matched)}): {', '.join(matched[:5])}")
        
        missing = data.get('missing_skills', [])
        print_info(f"  Missing skills ({len(missing)}): {', '.join(missing[:5])}")
        
        print_info(f"  Improvement tips:")
        for tip in data.get('improvements', [])[:3]:
            print_info(f"    • {tip}")
    else:
        print_error("Eligibility analysis failed")

def test_jd_feedback():
    """Test JD Feedback endpoint (NEW)"""
    print_header("TEST 6: JD Improvement Feedback (NEW)")
    print_info("Testing AI-generated improvement suggestions")
    
    jd = SAMPLE_JOB_DESCRIPTIONS[1]["text"]
    print(f"Job: {SAMPLE_JOB_DESCRIPTIONS[1]['title']}")
    
    payload = {
        "user_id": USER_ID,
        "job_description": jd
    }
    
    status, data = test_endpoint("POST", "/resume/jd-feedback", payload)
    
    if status == 200:
        print_success("Feedback generated successfully")
        feedback = data.get('feedback', [])
        print_info(f"  Suggestions ({len(feedback)}):")
        for suggestion in feedback[:5]:
            print_info(f"    • {suggestion}")
    else:
        print_error("Feedback generation failed")

def test_job_match():
    """Test Job Match endpoint"""
    print_header("TEST 7: Job Match Analysis")
    print_info("Testing skill-based job matching")
    
    payload = {
        "user_id": USER_ID,
        "job_description": SAMPLE_JOB_DESCRIPTIONS[0]["text"]
    }
    
    status, data = test_endpoint("POST", "/job-match", payload)
    
    if status == 200:
        print_success("Job match analyzed")
        print_info(f"  Match Score: {data.get('match_score', 0):.0f}%")
        print_info(f"  Matched skills: {len(data.get('matched_skills', []))}")
        print_info(f"  Missing skills: {len(data.get('missing_skills', []))}")
        print_info(f"  Recommended actions:")
        for action in data.get('recommended_actions', [])[:3]:
            print_info(f"    • {action}")
    else:
        print_error("Job match analysis failed")

def test_skill_gap():
    """Test Skill Gap Analysis"""
    print_header("TEST 8: Skill Gap Analysis")
    print_info("Testing missing skill identification")
    
    payload = {
        "user_id": USER_ID,
        "job_description": SAMPLE_JOB_DESCRIPTIONS[0]["text"]
    }
    
    status, data = test_endpoint("GET", "/skill-gap", payload)
    
    if status == 200:
        print_success("Skill gap analysis completed")
        
        missing = data.get('missing_skills', [])
        print_info(f"  Missing skills: {len(missing)}")
        for skill in missing[:5]:
            print_info(f"    • {skill}")
        
        ranking = data.get('priority_ranking', [])
        print_info(f"  Priority ranking (top 3):")
        for item in ranking[:3]:
            print_info(f"    {item.get('priority')}. {item.get('skill')} - {item.get('reason')}")
    else:
        print_error("Skill gap analysis failed")

def test_recruiter_simulation(resume_data: dict):
    """Test Recruiter Simulation"""
    print_header("TEST 9: Recruiter Simulation")
    print_info("Testing simulated recruiter feedback")
    
    if not resume_data or not resume_data.get('bullets'):
        print_error("No resume data - skipping recruiter simulation")
        return
    
    payload = {
        "resume_text": "\n".join(resume_data.get('bullets', [])),
        "job_description": SAMPLE_JOB_DESCRIPTIONS[0]["text"],
        "use_llm": False
    }
    
    status, data = test_endpoint("POST", "/recruiter/simulate", payload)
    
    if status == 200:
        print_success("Recruiter simulation completed")
        print_info(f"  Recruiter Score: {data.get('score', 0)}/100")
        print_info(f"  Strengths: {', '.join(data.get('strengths', [])[:3])}")
        print_info(f"  Weaknesses: {', '.join(data.get('weaknesses', [])[:3])}")
        print_info(f"  Suggestions:")
        for suggestion in data.get('suggestions', [])[:3]:
            print_info(f"    • {suggestion}")
    else:
        print_error("Recruiter simulation failed")

def test_career_insights():
    """Test Career Insights endpoint"""
    print_header("TEST 10: Career Insights")
    print_info("Testing career growth analysis")
    
    status, data = test_endpoint("GET", "/insights", {"user_id": USER_ID})
    
    if status == 200:
        print_success("Career insights generated")
        print_info(f"  Growth trend: {data.get('growth_trend')}")
        print_info(f"  Strengths: {', '.join(data.get('strength_areas', []))}")
        print_info(f"  Weak areas: {', '.join(data.get('weak_areas', []))}")
        print_info(f"  Recommendations:")
        for rec in data.get('recommendations', [])[:3]:
            print_info(f"    • {rec}")
    else:
        print_error("Career insights failed")

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    """Run all tests in sequence"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║         CareerOS API Testing Suite                         ║")
    print("║         Testing All Endpoints with Sample Data             ║")
    print(f"║         Backend: {API_BASE_URL:<40} ║")
    print(f"║         User ID: {USER_ID:<40} ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    
    start_time = time.time()
    
    try:
        # Test 1: Health check
        if not test_health_check():
            print_error("\nBackend is not running. Start it with: python app/main.py")
            return
        
        # Test 2: Events creation
        event_ids = test_events_creation()
        
        # Test 3: Resume generation
        resume_data = test_resume_generation(event_ids)
        
        # Test 4: Resume chat (NEW)
        test_resume_chat()
        
        # Test 5: JD Eligibility (NEW)
        test_jd_eligibility()
        
        # Test 6: JD Feedback (NEW)
        test_jd_feedback()
        
        # Test 7: Job match
        test_job_match()
        
        # Test 8: Skill gap
        test_skill_gap()
        
        # Test 9: Recruiter simulation
        test_recruiter_simulation(resume_data)
        
        # Test 10: Career insights
        test_career_insights()
        
    except KeyboardInterrupt:
        print_error("\nTests interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
    
    elapsed = time.time() - start_time
    
    print_header(f"Tests completed in {elapsed:.2f}s")
    print(f"\n{Colors.BOLD}Next Steps:{Colors.ENDC}")
    print(f"  1. Verify all endpoints returned 200 status codes")
    print(f"  2. Check response data formats match expected schemas")
    print(f"  3. Review AI-generated content (bullets, feedback, suggestions)")
    print(f"  4. Test with custom data as needed")
    print(f"  5. Refer to API documentation for detailed schema info")
    print()

if __name__ == "__main__":
    main()

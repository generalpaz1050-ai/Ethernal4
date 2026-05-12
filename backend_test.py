"""
Ethernal Backend API Test Suite
Tests all backend endpoints with real API calls
"""
import requests
import time
import json
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://ethernals-qa-build.preview.emergentagent.com/api"

# Test data storage
test_data = {
    "user": None,
    "token": None,
    "character": None,
    "chat": None,
}

def log_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} - {name}")
    if details:
        print(f"  Details: {details}")
    return passed

def test_auth_register():
    """Test POST /api/auth/register"""
    timestamp = int(time.time() * 1000)
    email = f"ethernal_test_{timestamp}@example.com"
    password = "SecurePass123!"
    name = "Ethernal Tester"
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password, "name": name},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            test_data["user"] = data["user"]
            test_data["token"] = data["token"]
            test_data["email"] = email
            test_data["password"] = password
            return log_test("POST /api/auth/register", True, f"User created: {email}")
        else:
            return log_test("POST /api/auth/register", False, "Missing token or user in response")
    else:
        return log_test("POST /api/auth/register", False, f"Status {response.status_code}: {response.text}")

def test_auth_login():
    """Test POST /api/auth/login"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": test_data["email"], "password": test_data["password"]},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            return log_test("POST /api/auth/login", True, f"Login successful for {test_data['email']}")
        else:
            return log_test("POST /api/auth/login", False, "Missing token or user in response")
    else:
        return log_test("POST /api/auth/login", False, f"Status {response.status_code}: {response.text}")

def test_auth_me():
    """Test GET /api/auth/me"""
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if "user" in data:
            return log_test("GET /api/auth/me", True, f"User: {data['user'].get('email')}")
        else:
            return log_test("GET /api/auth/me", False, "Missing user in response")
    else:
        return log_test("GET /api/auth/me", False, f"Status {response.status_code}: {response.text}")

def test_auth_profile_update():
    """Test PUT /api/auth/profile"""
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    update_data = {
        "name": "Updated Tester",
        "bio": "Testing Ethernal backend APIs",
        "theme": "darkFantasy",
        "language": "en"
    }
    response = requests.put(
        f"{BASE_URL}/auth/profile",
        json=update_data,
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and "user" in data:
            user = data["user"]
            if user.get("theme") == "darkFantasy" and user.get("language") == "en":
                return log_test("PUT /api/auth/profile", True, "Profile updated successfully")
            else:
                return log_test("PUT /api/auth/profile", False, "Profile not updated correctly")
        else:
            return log_test("PUT /api/auth/profile", False, "Missing success or user in response")
    else:
        return log_test("PUT /api/auth/profile", False, f"Status {response.status_code}: {response.text}")

def test_character_create():
    """Test POST /api/characters"""
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    character_data = {
        "name": "Luna Shadowmere",
        "description": "A mysterious sorceress from the ancient realm of Eldoria",
        "personality": "Enigmatic, wise, slightly mischievous with a dark sense of humor",
        "backstory": "Once a royal court mage, now wandering the realms seeking forbidden knowledge",
        "scenario": "You encounter Luna in a dimly lit tavern, her eyes glowing faintly with arcane energy",
        "universe": "Eldoria - A high fantasy realm of magic and mystery",
        "isPublic": True
    }
    response = requests.post(
        f"{BASE_URL}/characters",
        json=character_data,
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "character" in data:
            test_data["character"] = data["character"]
            return log_test("POST /api/characters", True, f"Character created: {data['character'].get('name')}")
        else:
            return log_test("POST /api/characters", False, "Missing character in response")
    else:
        return log_test("POST /api/characters", False, f"Status {response.status_code}: {response.text}")

def test_character_list_private():
    """Test GET /api/characters (user's characters)"""
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    response = requests.get(f"{BASE_URL}/characters", headers=headers, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if "characters" in data:
            chars = data["characters"]
            if len(chars) > 0:
                return log_test("GET /api/characters (private)", True, f"Found {len(chars)} character(s)")
            else:
                return log_test("GET /api/characters (private)", False, "No characters found")
        else:
            return log_test("GET /api/characters (private)", False, "Missing characters in response")
    else:
        return log_test("GET /api/characters (private)", False, f"Status {response.status_code}: {response.text}")

def test_character_list_public():
    """Test GET /api/characters?public=true (no auth needed)"""
    response = requests.get(f"{BASE_URL}/characters?public=true", timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if "characters" in data:
            return log_test("GET /api/characters?public=true", True, f"Found {len(data['characters'])} public character(s)")
        else:
            return log_test("GET /api/characters?public=true", False, "Missing characters in response")
    else:
        return log_test("GET /api/characters?public=true", False, f"Status {response.status_code}: {response.text}")

def test_character_update():
    """Test PUT /api/characters/{id}"""
    if not test_data.get("character"):
        return log_test("PUT /api/characters/{id}", False, "No character to update")
    
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    char_id = test_data["character"]["id"]
    update_data = {
        "name": "Luna Shadowmere (Updated)",
        "description": "An even more mysterious sorceress",
        "personality": "Enigmatic, wise, slightly mischievous",
        "backstory": "Updated backstory",
        "scenario": "Updated scenario",
        "universe": "Eldoria",
        "isPublic": True
    }
    response = requests.put(
        f"{BASE_URL}/characters/{char_id}",
        json=update_data,
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return log_test("PUT /api/characters/{id}", True, "Character updated successfully")
        else:
            return log_test("PUT /api/characters/{id}", False, "Success not true")
    else:
        return log_test("PUT /api/characters/{id}", False, f"Status {response.status_code}: {response.text}")

def test_character_like():
    """Test POST /api/characters/{id}/like"""
    if not test_data.get("character"):
        return log_test("POST /api/characters/{id}/like", False, "No character to like")
    
    char_id = test_data["character"]["id"]
    response = requests.post(f"{BASE_URL}/characters/{char_id}/like", timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return log_test("POST /api/characters/{id}/like", True, "Character liked successfully")
        else:
            return log_test("POST /api/characters/{id}/like", False, "Success not true")
    else:
        return log_test("POST /api/characters/{id}/like", False, f"Status {response.status_code}: {response.text}")

def test_chat_create():
    """Test POST /api/chats"""
    if not test_data.get("character"):
        return log_test("POST /api/chats", False, "No character to chat with")
    
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    char_id = test_data["character"]["id"]
    response = requests.post(
        f"{BASE_URL}/chats",
        json={"characterId": char_id},
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "chat" in data and "character" in data:
            test_data["chat"] = data["chat"]
            return log_test("POST /api/chats", True, f"Chat created with {data['character'].get('name')}")
        else:
            return log_test("POST /api/chats", False, "Missing chat or character in response")
    else:
        return log_test("POST /api/chats", False, f"Status {response.status_code}: {response.text}")

def test_chat_list():
    """Test GET /api/chats"""
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    response = requests.get(f"{BASE_URL}/chats", headers=headers, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if "chats" in data:
            chats = data["chats"]
            if len(chats) > 0:
                return log_test("GET /api/chats", True, f"Found {len(chats)} chat(s)")
            else:
                return log_test("GET /api/chats", False, "No chats found")
        else:
            return log_test("GET /api/chats", False, "Missing chats in response")
    else:
        return log_test("GET /api/chats", False, f"Status {response.status_code}: {response.text}")

def test_chat_message_multiturn():
    """Test POST /api/chats/{id}/message - Multi-turn context test"""
    if not test_data.get("chat"):
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, "No chat to send message to")
    
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    chat_id = test_data["chat"]["id"]
    
    # Message 1: Introduce a name
    print("\n  Sending message 1: Introducing 'Aria' as a name...")
    msg1 = "Hello Luna! My name is Aria, and I'm seeking knowledge about ancient spells."
    response1 = requests.post(
        f"{BASE_URL}/chats/{chat_id}/message",
        json={"message": msg1},
        headers=headers,
        timeout=60
    )
    
    if response1.status_code != 200:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, f"Message 1 failed: {response1.status_code}")
    
    data1 = response1.json()
    if not data1.get("success") or "assistantMessage" not in data1:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, "Message 1 response invalid")
    
    ai_response1 = data1["assistantMessage"]["content"]
    print(f"  AI Response 1: {ai_response1[:150]}...")
    
    # Message 2: Ask about something else
    time.sleep(2)
    print("\n  Sending message 2: Asking about the tavern...")
    msg2 = "What can you tell me about this tavern we're in?"
    response2 = requests.post(
        f"{BASE_URL}/chats/{chat_id}/message",
        json={"message": msg2},
        headers=headers,
        timeout=60
    )
    
    if response2.status_code != 200:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, f"Message 2 failed: {response2.status_code}")
    
    data2 = response2.json()
    if not data2.get("success") or "assistantMessage" not in data2:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, "Message 2 response invalid")
    
    ai_response2 = data2["assistantMessage"]["content"]
    print(f"  AI Response 2: {ai_response2[:150]}...")
    
    # Message 3: Reference the name from message 1
    time.sleep(2)
    print("\n  Sending message 3: Asking AI to recall 'Aria' from message 1...")
    msg3 = "Do you remember my name?"
    response3 = requests.post(
        f"{BASE_URL}/chats/{chat_id}/message",
        json={"message": msg3},
        headers=headers,
        timeout=60
    )
    
    if response3.status_code != 200:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, f"Message 3 failed: {response3.status_code}")
    
    data3 = response3.json()
    if not data3.get("success") or "assistantMessage" not in data3:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, "Message 3 response invalid")
    
    ai_response3 = data3["assistantMessage"]["content"]
    print(f"  AI Response 3: {ai_response3[:200]}...")
    
    # Check if AI remembers the name "Aria"
    if "aria" in ai_response3.lower():
        return log_test("POST /api/chats/{id}/message (multi-turn)", True, "✅ AI maintained context across 3 messages and remembered 'Aria'")
    else:
        return log_test("POST /api/chats/{id}/message (multi-turn)", False, f"❌ AI did NOT remember 'Aria' from message 1. Response: {ai_response3[:300]}")

def test_image_generation():
    """Test POST /api/generate-image"""
    if not test_data.get("chat"):
        return log_test("POST /api/generate-image", False, "No chat for image generation")
    
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    chat_id = test_data["chat"]["id"]
    
    print("\n  Generating image (may take 10-30s)...")
    response = requests.post(
        f"{BASE_URL}/generate-image",
        json={"prompt": "A mystical sorceress casting a spell in a dark tavern", "chatId": chat_id},
        headers=headers,
        timeout=60
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and "imageUrl" in data:
            image_url = data["imageUrl"]
            # Check if it's a base64 data URL or picsum fallback
            if image_url.startswith("data:image/") or "picsum.photos" in image_url:
                return log_test("POST /api/generate-image", True, f"Image generated: {image_url[:80]}...")
            else:
                return log_test("POST /api/generate-image", False, f"Unexpected image URL format: {image_url}")
        else:
            return log_test("POST /api/generate-image", False, "Missing success or imageUrl in response")
    else:
        return log_test("POST /api/generate-image", False, f"Status {response.status_code}: {response.text}")

def test_character_delete():
    """Test DELETE /api/characters/{id} - Run last to clean up"""
    if not test_data.get("character"):
        return log_test("DELETE /api/characters/{id}", False, "No character to delete")
    
    headers = {"Authorization": f"Bearer {test_data['token']}"}
    char_id = test_data["character"]["id"]
    response = requests.delete(
        f"{BASE_URL}/characters/{char_id}",
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return log_test("DELETE /api/characters/{id}", True, "Character deleted successfully")
        else:
            return log_test("DELETE /api/characters/{id}", False, "Success not true")
    else:
        return log_test("DELETE /api/characters/{id}", False, f"Status {response.status_code}: {response.text}")

def run_all_tests():
    """Run all backend tests in sequence"""
    print("=" * 80)
    print("ETHERNAL BACKEND API TEST SUITE")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    print("=" * 80)
    
    results = []
    
    # Auth tests
    print("\n" + "=" * 80)
    print("AUTH TESTS")
    print("=" * 80)
    results.append(test_auth_register())
    results.append(test_auth_login())
    results.append(test_auth_me())
    results.append(test_auth_profile_update())
    
    # Character tests
    print("\n" + "=" * 80)
    print("CHARACTER TESTS")
    print("=" * 80)
    results.append(test_character_create())
    results.append(test_character_list_private())
    results.append(test_character_list_public())
    results.append(test_character_update())
    results.append(test_character_like())
    
    # Chat tests
    print("\n" + "=" * 80)
    print("CHAT TESTS")
    print("=" * 80)
    results.append(test_chat_create())
    results.append(test_chat_list())
    results.append(test_chat_message_multiturn())
    
    # Image generation test
    print("\n" + "=" * 80)
    print("IMAGE GENERATION TEST")
    print("=" * 80)
    results.append(test_image_generation())
    
    # Cleanup
    print("\n" + "=" * 80)
    print("CLEANUP")
    print("=" * 80)
    results.append(test_character_delete())
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print("=" * 80)
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)

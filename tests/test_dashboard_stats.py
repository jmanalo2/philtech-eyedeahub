"""
Test Dashboard Stats API - Verifies implemented_ideas and assigned_to_te_ideas counts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eyedea-hub.preview.emergentagent.com')

class TestDashboardStats:
    """Dashboard stats endpoint tests - Priority 1 testing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats_endpoint_returns_200(self):
        """Test that dashboard stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Dashboard stats endpoint returns 200 OK")
    
    def test_dashboard_stats_has_implemented_ideas_field(self):
        """Test that dashboard stats includes implemented_ideas field"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "implemented_ideas" in data, "implemented_ideas field missing from response"
        assert isinstance(data["implemented_ideas"], int), "implemented_ideas should be an integer"
        print(f"implemented_ideas field present with value: {data['implemented_ideas']}")
    
    def test_dashboard_stats_has_assigned_to_te_ideas_field(self):
        """Test that dashboard stats includes assigned_to_te_ideas field"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "assigned_to_te_ideas" in data, "assigned_to_te_ideas field missing from response"
        assert isinstance(data["assigned_to_te_ideas"], int), "assigned_to_te_ideas should be an integer"
        print(f"assigned_to_te_ideas field present with value: {data['assigned_to_te_ideas']}")
    
    def test_dashboard_stats_has_best_idea_field(self):
        """Test that dashboard stats includes best_idea field"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "best_idea" in data, "best_idea field missing from response"
        # best_idea can be null or an object
        if data["best_idea"] is not None:
            assert isinstance(data["best_idea"], dict), "best_idea should be a dict when present"
            print(f"best_idea field present with title: {data['best_idea'].get('title', 'N/A')}")
        else:
            print("best_idea field present but is null (no best idea selected)")
    
    def test_dashboard_stats_counts_match_ideas_list(self):
        """Verify dashboard stats counts match actual ideas in database"""
        # Get dashboard stats
        stats_response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        # Get all ideas
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        # Count ideas by status
        status_counts = {}
        for idea in ideas:
            status = idea.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Verify counts match
        assert stats["total_ideas"] == len(ideas), f"Total ideas mismatch: {stats['total_ideas']} vs {len(ideas)}"
        assert stats["implemented_ideas"] == status_counts.get("implemented", 0), \
            f"Implemented ideas mismatch: {stats['implemented_ideas']} vs {status_counts.get('implemented', 0)}"
        assert stats["assigned_to_te_ideas"] == status_counts.get("assigned_to_te", 0), \
            f"Assigned to T&E ideas mismatch: {stats['assigned_to_te_ideas']} vs {status_counts.get('assigned_to_te', 0)}"
        
        print(f"All counts verified:")
        print(f"  - Total: {stats['total_ideas']}")
        print(f"  - Implemented: {stats['implemented_ideas']}")
        print(f"  - Assigned to T&E: {stats['assigned_to_te_ideas']}")
    
    def test_dashboard_stats_all_required_fields(self):
        """Test that all required fields are present in dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "total_ideas",
            "pending_ideas",
            "approved_ideas",
            "declined_ideas",
            "revision_requested_ideas",
            "implemented_ideas",
            "assigned_to_te_ideas",
            "my_ideas",
            "best_idea"
        ]
        
        for field in required_fields:
            assert field in data, f"Required field '{field}' missing from response"
        
        print(f"All {len(required_fields)} required fields present in dashboard stats")


class TestIdeasFiltering:
    """Test ideas filtering by status"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_filter_ideas_by_implemented_status(self):
        """Test filtering ideas by implemented status"""
        response = requests.get(f"{BASE_URL}/api/ideas", 
                               params={"status": "implemented"}, 
                               headers=self.headers)
        assert response.status_code == 200
        ideas = response.json()
        
        # All returned ideas should have implemented status
        for idea in ideas:
            assert idea["status"] == "implemented", f"Expected implemented status, got {idea['status']}"
        
        print(f"Filter by implemented status works: {len(ideas)} ideas returned")
    
    def test_filter_ideas_by_assigned_to_te_status(self):
        """Test filtering ideas by assigned_to_te status"""
        response = requests.get(f"{BASE_URL}/api/ideas", 
                               params={"status": "assigned_to_te"}, 
                               headers=self.headers)
        assert response.status_code == 200
        ideas = response.json()
        
        # All returned ideas should have assigned_to_te status
        for idea in ideas:
            assert idea["status"] == "assigned_to_te", f"Expected assigned_to_te status, got {idea['status']}"
        
        print(f"Filter by assigned_to_te status works: {len(ideas)} ideas returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

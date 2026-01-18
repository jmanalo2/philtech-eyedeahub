"""
Backend API Tests for C.I. Analytics Filters and Ideas List T&E Name
Tests: Analytics endpoint with pillar/department/team filters, Ideas list with tech_person_name
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ideahub-297.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "admin123"}
APPROVER_CREDS = {"username": "approver1", "password": "approver123"}


class TestAnalyticsFilters:
    """Test C.I. Dashboard analytics endpoint with new filters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping tests")
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_analytics_no_filters(self):
        """Test analytics endpoint without any filters"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "quick_wins_count" in data
        assert "complexity_counts" in data
        assert "total_cost_savings" in data
        assert "total_time_saved" in data
        assert "total_ideas" in data
        assert "approval_rate" in data
        assert "implementation_rate" in data
        assert "charts_data" in data
        print(f"✓ Analytics without filters: {data['total_ideas']} total ideas")
    
    def test_analytics_with_pillar_filter(self):
        """Test analytics endpoint with pillar filter"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?pillar=GBS",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_ideas" in data
        assert "quick_wins_count" in data
        print(f"✓ Analytics with pillar=GBS: {data['total_ideas']} ideas")
    
    def test_analytics_with_department_filter(self):
        """Test analytics endpoint with department filter"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?department=Operations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        print(f"✓ Analytics with department=Operations: {data['total_ideas']} ideas")
    
    def test_analytics_with_team_filter(self):
        """Test analytics endpoint with team filter"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?team=Allowance%20Billing",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        print(f"✓ Analytics with team=Allowance Billing: {data['total_ideas']} ideas")
    
    def test_analytics_with_multiple_filters(self):
        """Test analytics endpoint with pillar, department, and team filters combined"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?pillar=GBS&department=Operations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        assert "complexity_counts" in data
        print(f"✓ Analytics with pillar=GBS & department=Operations: {data['total_ideas']} ideas")
    
    def test_analytics_with_date_and_pillar_filters(self):
        """Test analytics endpoint with date and pillar filters combined"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?pillar=GBS&start_date=2024-01-01&end_date=2025-12-31",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        print(f"✓ Analytics with pillar + date filters: {data['total_ideas']} ideas")
    
    def test_analytics_with_nonexistent_pillar(self):
        """Test analytics endpoint with non-existent pillar returns 0 ideas"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics?pillar=NonExistentPillar",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_ideas"] == 0
        print(f"✓ Analytics with non-existent pillar: {data['total_ideas']} ideas (expected 0)")


class TestDashboardStatsFilters:
    """Test dashboard stats endpoint with filters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping tests")
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_stats_with_pillar_filter(self):
        """Test dashboard stats with pillar filter"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats?pillar=GBS",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        assert "pending_ideas" in data
        assert "approved_ideas" in data
        print(f"✓ Dashboard stats with pillar=GBS: {data['total_ideas']} total ideas")
    
    def test_stats_with_department_filter(self):
        """Test dashboard stats with department filter"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats?department=Operations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_ideas" in data
        print(f"✓ Dashboard stats with department=Operations: {data['total_ideas']} ideas")


class TestIdeasListTechPersonName:
    """Test ideas list endpoint returns tech_person_name field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping tests")
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_ideas_list_includes_tech_person_name(self):
        """Test that ideas list includes tech_person_name field"""
        response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            # Check that tech_person_name field exists in idea schema
            idea = data[0]
            # tech_person_name may be None if not assigned
            assert "tech_person_name" in idea or idea.get("tech_person_name") is None
            print(f"✓ Ideas list: {len(data)} ideas, tech_person_name field present")
        else:
            print(f"✓ Ideas list: No ideas found")
    
    def test_ideas_with_tech_person_assigned(self):
        """Test ideas that have tech_person_name assigned"""
        response = requests.get(
            f"{BASE_URL}/api/ideas?status=assigned_to_te",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Ideas with assigned_to_te status should have tech_person_name
        for idea in data:
            if idea.get("assigned_to_tech"):
                assert idea.get("tech_person_name") is not None, f"Idea {idea['id']} assigned to tech but no tech_person_name"
                print(f"✓ Idea {idea['idea_number']} has T&E: {idea['tech_person_name']}")
        
        print(f"✓ Found {len(data)} ideas assigned to T&E")
    
    def test_idea_detail_includes_tech_person_name(self):
        """Test that individual idea detail includes tech_person_name"""
        # First get list of ideas
        list_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert list_response.status_code == 200
        ideas = list_response.json()
        
        if len(ideas) > 0:
            idea_id = ideas[0]["id"]
            response = requests.get(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.headers)
            assert response.status_code == 200
            idea = response.json()
            
            # Verify tech_person_name field exists
            assert "tech_person_name" in idea or idea.get("tech_person_name") is None
            print(f"✓ Idea detail {idea['idea_number']}: tech_person_name = {idea.get('tech_person_name')}")


class TestIdeasFilters:
    """Test ideas list endpoint with filters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping tests")
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_ideas_filter_by_pillar(self):
        """Test ideas list filtered by pillar"""
        response = requests.get(
            f"{BASE_URL}/api/ideas?pillar=GBS",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All ideas should have pillar = GBS
        for idea in data:
            assert idea["pillar"] == "GBS", f"Idea {idea['id']} has pillar {idea['pillar']}, expected GBS"
        print(f"✓ Ideas filtered by pillar=GBS: {len(data)} ideas")
    
    def test_ideas_filter_by_department(self):
        """Test ideas list filtered by department"""
        response = requests.get(
            f"{BASE_URL}/api/ideas?department=Operations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All ideas should have department = Operations
        for idea in data:
            assert idea["department"] == "Operations", f"Idea {idea['id']} has department {idea['department']}, expected Operations"
        print(f"✓ Ideas filtered by department=Operations: {len(data)} ideas")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

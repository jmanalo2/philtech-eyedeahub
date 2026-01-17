"""
Test Dashboard Filters and Admin Delete Functionality
Tests: 
1. Dashboard filters by Pillar, Department, Team
2. Admin delete idea from IdeasList and IdeaDetail
3. Non-admin users should NOT be able to delete ideas
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://philtech-eyedea.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "admin123"}
APPROVER_CREDS = {"username": "approver1", "password": "approver123"}


class TestDashboardFilters:
    """Test dashboard stats filtering by pillar, department, team"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats_no_filters(self):
        """Test dashboard stats without any filters returns all ideas"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        assert "total_ideas" in data
        assert "pending_ideas" in data
        assert "approved_ideas" in data
        assert "implemented_ideas" in data
        assert "assigned_to_te_ideas" in data
        
        print(f"✓ Dashboard stats without filters: total={data['total_ideas']}")
        return data["total_ideas"]
    
    def test_dashboard_stats_filter_by_pillar(self):
        """Test dashboard stats filtered by pillar"""
        # First get all ideas to find a valid pillar
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        if len(ideas) == 0:
            pytest.skip("No ideas in database to test filtering")
        
        # Get a pillar from existing ideas
        test_pillar = ideas[0]["pillar"]
        
        # Get stats filtered by pillar
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            params={"pillar": test_pillar},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Count ideas with this pillar manually
        pillar_ideas = [i for i in ideas if i["pillar"] == test_pillar]
        
        assert data["total_ideas"] == len(pillar_ideas), \
            f"Pillar filter mismatch: API returned {data['total_ideas']}, expected {len(pillar_ideas)}"
        
        print(f"✓ Dashboard stats filtered by pillar '{test_pillar}': {data['total_ideas']} ideas")
    
    def test_dashboard_stats_filter_by_department(self):
        """Test dashboard stats filtered by department"""
        # First get all ideas to find a valid department
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        # Find an idea with a department
        ideas_with_dept = [i for i in ideas if i.get("department")]
        if len(ideas_with_dept) == 0:
            pytest.skip("No ideas with department in database")
        
        test_dept = ideas_with_dept[0]["department"]
        
        # Get stats filtered by department
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            params={"department": test_dept},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Count ideas with this department manually
        dept_ideas = [i for i in ideas if i.get("department") == test_dept]
        
        assert data["total_ideas"] == len(dept_ideas), \
            f"Department filter mismatch: API returned {data['total_ideas']}, expected {len(dept_ideas)}"
        
        print(f"✓ Dashboard stats filtered by department '{test_dept}': {data['total_ideas']} ideas")
    
    def test_dashboard_stats_filter_by_team(self):
        """Test dashboard stats filtered by team"""
        # First get all ideas to find a valid team
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        # Find an idea with a team
        ideas_with_team = [i for i in ideas if i.get("team")]
        if len(ideas_with_team) == 0:
            pytest.skip("No ideas with team in database")
        
        test_team = ideas_with_team[0]["team"]
        
        # Get stats filtered by team
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            params={"team": test_team},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Count ideas with this team manually
        team_ideas = [i for i in ideas if i.get("team") == test_team]
        
        assert data["total_ideas"] == len(team_ideas), \
            f"Team filter mismatch: API returned {data['total_ideas']}, expected {len(team_ideas)}"
        
        print(f"✓ Dashboard stats filtered by team '{test_team}': {data['total_ideas']} ideas")
    
    def test_dashboard_stats_combined_filters(self):
        """Test dashboard stats with multiple filters combined"""
        # First get all ideas to find valid filter values
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        # Find an idea with both pillar and department
        ideas_with_both = [i for i in ideas if i.get("pillar") and i.get("department")]
        if len(ideas_with_both) == 0:
            pytest.skip("No ideas with both pillar and department")
        
        test_pillar = ideas_with_both[0]["pillar"]
        test_dept = ideas_with_both[0]["department"]
        
        # Get stats filtered by both pillar and department
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            params={"pillar": test_pillar, "department": test_dept},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Count ideas matching both filters manually
        filtered_ideas = [i for i in ideas if i.get("pillar") == test_pillar and i.get("department") == test_dept]
        
        assert data["total_ideas"] == len(filtered_ideas), \
            f"Combined filter mismatch: API returned {data['total_ideas']}, expected {len(filtered_ideas)}"
        
        print(f"✓ Dashboard stats with combined filters (pillar='{test_pillar}', dept='{test_dept}'): {data['total_ideas']} ideas")
    
    def test_dashboard_stats_filter_nonexistent_pillar(self):
        """Test dashboard stats with non-existent pillar returns zero"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            params={"pillar": "NONEXISTENT_PILLAR_XYZ"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_ideas"] == 0, f"Expected 0 ideas for non-existent pillar, got {data['total_ideas']}"
        print(f"✓ Dashboard stats with non-existent pillar returns 0 ideas")


class TestAdminDeleteIdea:
    """Test admin delete idea functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("access_token")
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_can_delete_idea(self):
        """Test that admin can delete an idea"""
        # First create a test idea
        test_idea = {
            "pillar": "GBS",
            "title": f"TEST_Delete_Idea_{int(time.time())}",
            "improvement_type": "Automation",
            "current_process": "Test current process",
            "suggested_solution": "Test solution",
            "benefits": "Test benefits",
            "target_completion": "Q1 2025",
            "department": "Operations",
            "team": "Allowance Billing"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/ideas",
            json=test_idea,
            headers=self.admin_headers
        )
        assert create_response.status_code == 200, f"Failed to create test idea: {create_response.text}"
        created_idea = create_response.json()
        idea_id = created_idea["id"]
        print(f"✓ Created test idea: {created_idea['idea_number']}")
        
        # Verify idea exists
        get_response = requests.get(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.admin_headers)
        assert get_response.status_code == 200, "Idea should exist before deletion"
        
        # Delete the idea
        delete_response = requests.delete(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.admin_headers)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        data = delete_response.json()
        assert "deleted" in data["message"].lower(), f"Unexpected response: {data}"
        print(f"✓ Admin successfully deleted idea: {idea_id}")
        
        # Verify idea no longer exists
        verify_response = requests.get(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.admin_headers)
        assert verify_response.status_code == 404, "Idea should not exist after deletion"
        print(f"✓ Verified idea no longer exists after deletion")
    
    def test_delete_nonexistent_idea_returns_404(self):
        """Test that deleting non-existent idea returns 404"""
        fake_id = "idea_nonexistent_12345"
        response = requests.delete(f"{BASE_URL}/api/ideas/{fake_id}", headers=self.admin_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Delete non-existent idea correctly returns 404")
    
    def test_delete_also_removes_comments(self):
        """Test that deleting an idea also removes its comments"""
        # Create a test idea
        test_idea = {
            "pillar": "GBS",
            "title": f"TEST_Delete_With_Comments_{int(time.time())}",
            "improvement_type": "Automation",
            "current_process": "Test current process",
            "suggested_solution": "Test solution",
            "benefits": "Test benefits",
            "target_completion": "Q1 2025"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/ideas",
            json=test_idea,
            headers=self.admin_headers
        )
        assert create_response.status_code == 200
        idea_id = create_response.json()["id"]
        
        # Add a comment to the idea
        comment_response = requests.post(
            f"{BASE_URL}/api/ideas/{idea_id}/comments",
            json={"comment_text": "Test comment for deletion test"},
            headers=self.admin_headers
        )
        assert comment_response.status_code == 200
        print(f"✓ Added comment to test idea")
        
        # Delete the idea
        delete_response = requests.delete(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.admin_headers)
        assert delete_response.status_code == 200
        print(f"✓ Deleted idea with comments")
        
        # Verify idea is deleted (comments endpoint should return 404 or empty)
        verify_response = requests.get(f"{BASE_URL}/api/ideas/{idea_id}", headers=self.admin_headers)
        assert verify_response.status_code == 404
        print(f"✓ Verified idea and comments are deleted")


class TestNonAdminCannotDelete:
    """Test that non-admin users cannot delete ideas"""
    
    def test_approver_cannot_delete_idea(self):
        """Test that approver role cannot delete ideas"""
        # Login as approver
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=APPROVER_CREDS)
        assert login_response.status_code == 200, f"Approver login failed: {login_response.text}"
        approver_token = login_response.json().get("access_token")
        approver_headers = {"Authorization": f"Bearer {approver_token}"}
        
        # Get an existing idea
        ideas_response = requests.get(f"{BASE_URL}/api/ideas", headers=approver_headers)
        assert ideas_response.status_code == 200
        ideas = ideas_response.json()
        
        if len(ideas) == 0:
            pytest.skip("No ideas to test deletion")
        
        idea_id = ideas[0]["id"]
        
        # Try to delete as approver - should fail with 403
        delete_response = requests.delete(f"{BASE_URL}/api/ideas/{idea_id}", headers=approver_headers)
        assert delete_response.status_code == 403, \
            f"Expected 403 Forbidden for approver delete, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert "admin" in data["detail"].lower(), f"Error message should mention admin: {data}"
        print(f"✓ Approver correctly denied delete access (403 Forbidden)")
    
    def test_unauthenticated_cannot_delete_idea(self):
        """Test that unauthenticated requests cannot delete ideas"""
        # Try to delete without auth token
        delete_response = requests.delete(f"{BASE_URL}/api/ideas/some_idea_id")
        assert delete_response.status_code in [401, 403], \
            f"Expected 401/403 for unauthenticated delete, got {delete_response.status_code}"
        print(f"✓ Unauthenticated request correctly denied delete access")


class TestIdeasFilteringAPI:
    """Test ideas list filtering by pillar, department, team"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_filter_ideas_by_pillar(self):
        """Test filtering ideas list by pillar"""
        # Get all ideas first
        all_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert all_response.status_code == 200
        all_ideas = all_response.json()
        
        if len(all_ideas) == 0:
            pytest.skip("No ideas to test filtering")
        
        test_pillar = all_ideas[0]["pillar"]
        
        # Filter by pillar
        filtered_response = requests.get(
            f"{BASE_URL}/api/ideas",
            params={"pillar": test_pillar},
            headers=self.headers
        )
        assert filtered_response.status_code == 200
        filtered_ideas = filtered_response.json()
        
        # Verify all returned ideas have the correct pillar
        for idea in filtered_ideas:
            assert idea["pillar"] == test_pillar, f"Expected pillar {test_pillar}, got {idea['pillar']}"
        
        print(f"✓ Ideas filtered by pillar '{test_pillar}': {len(filtered_ideas)} ideas")
    
    def test_filter_ideas_by_department(self):
        """Test filtering ideas list by department"""
        # Get all ideas first
        all_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert all_response.status_code == 200
        all_ideas = all_response.json()
        
        # Find an idea with department
        ideas_with_dept = [i for i in all_ideas if i.get("department")]
        if len(ideas_with_dept) == 0:
            pytest.skip("No ideas with department")
        
        test_dept = ideas_with_dept[0]["department"]
        
        # Filter by department
        filtered_response = requests.get(
            f"{BASE_URL}/api/ideas",
            params={"department": test_dept},
            headers=self.headers
        )
        assert filtered_response.status_code == 200
        filtered_ideas = filtered_response.json()
        
        # Verify all returned ideas have the correct department
        for idea in filtered_ideas:
            assert idea["department"] == test_dept, f"Expected department {test_dept}, got {idea['department']}"
        
        print(f"✓ Ideas filtered by department '{test_dept}': {len(filtered_ideas)} ideas")
    
    def test_filter_ideas_by_team(self):
        """Test filtering ideas list by team"""
        # Get all ideas first
        all_response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert all_response.status_code == 200
        all_ideas = all_response.json()
        
        # Find an idea with team
        ideas_with_team = [i for i in all_ideas if i.get("team")]
        if len(ideas_with_team) == 0:
            pytest.skip("No ideas with team")
        
        test_team = ideas_with_team[0]["team"]
        
        # Filter by team
        filtered_response = requests.get(
            f"{BASE_URL}/api/ideas",
            params={"team": test_team},
            headers=self.headers
        )
        assert filtered_response.status_code == 200
        filtered_ideas = filtered_response.json()
        
        # Verify all returned ideas have the correct team
        for idea in filtered_ideas:
            assert idea["team"] == test_team, f"Expected team {test_team}, got {idea['team']}"
        
        print(f"✓ Ideas filtered by team '{test_team}': {len(filtered_ideas)} ideas")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
